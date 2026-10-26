// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IGaugeAdapter {
    function isGaugeValid(address gauge) external view returns (bool);
}

contract BribeMarket {
    enum EpochStatus { Open, VotingClosed, Dispute, ClaimsOpen }

    error NotOwner();
    error NotPublisher();
    error NotGuardian();
    error ClaimsPaused();
    error TokenNotAllowed();
    error InvalidAmount();
    error EpochNotOpen();
    error EpochClosed();
    error GaugeInvalid();
    error GaugeStillValid();
    error GaugeAdapterMissing();
    error RootAlreadyPublished();
    error RootMissing();
    error ClaimsNotOpen();
    error AlreadyClaimed();
    error InvalidProof();
    error ExceedsBribe();
    error TransferFailed();
    error FeeOnTransferUnsupported();
    error DisputeActive();
    error NoRefundAvailable();
    error ReentrantCall();

    struct EpochConfig {
        EpochStatus status;
        uint64 depositClose;
        uint64 disputeEnds;
        bytes32 merkleRoot;
    }

    address public owner;
    address public publisher;
    address public guardian;
    IGaugeAdapter public gaugeAdapter;
    uint256 public disputeWindow = 1 days;
    bool public claimsPaused;
    uint256 private reentrancyStatus = 1;

    mapping(address => bool) public allowedToken;
    mapping(address => uint256) public minimumDeposit;
    mapping(uint256 => EpochConfig) public epochs;
    mapping(uint256 => mapping(address => mapping(address => uint256))) public bribeTotal;
    mapping(uint256 => mapping(address => mapping(address => mapping(address => uint256)))) public depositedBy;
    mapping(uint256 => mapping(address => mapping(address => uint256))) public claimedTotal;
    mapping(uint256 => mapping(address => mapping(address => mapping(address => bool)))) public claimed;
    mapping(uint256 => mapping(address => mapping(address => mapping(address => bool)))) public refunded;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PublisherUpdated(address indexed publisher);
    event GuardianUpdated(address indexed guardian);
    event GaugeAdapterUpdated(address indexed adapter);
    event TokenAllowlisted(address indexed token, bool allowed, uint256 minimumDeposit);
    event EpochStateChanged(uint256 indexed epoch, EpochStatus status, uint256 timestamp);
    event BribeDeposited(address indexed briber, uint256 indexed epoch, address indexed gauge, address token, uint256 amount);
    event RootPublished(uint256 indexed epoch, bytes32 indexed root, uint256 disputeEnds);
    event Claimed(address indexed voter, uint256 indexed epoch, address indexed gauge, address token, uint256 amount);
    event BribeRefunded(address indexed briber, uint256 indexed epoch, address indexed gauge, address token, uint256 amount);
    event ClaimsPauseChanged(bool paused);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyPublisher() {
        if (msg.sender != publisher) revert NotPublisher();
        _;
    }

    modifier onlyGuardian() {
        if (msg.sender != guardian) revert NotGuardian();
        _;
    }

    modifier nonReentrant() {
        if (reentrancyStatus != 1) revert ReentrantCall();
        reentrancyStatus = 2;
        _;
        reentrancyStatus = 1;
    }

    constructor(address publisher_) {
        owner = msg.sender;
        publisher = publisher_ == address(0) ? msg.sender : publisher_;
        guardian = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        emit PublisherUpdated(publisher);
        emit GuardianUpdated(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAmount();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setPublisher(address newPublisher) external onlyOwner {
        if (newPublisher == address(0)) revert InvalidAmount();
        publisher = newPublisher;
        emit PublisherUpdated(newPublisher);
    }

    function setGuardian(address newGuardian) external onlyOwner {
        guardian = newGuardian;
        emit GuardianUpdated(newGuardian);
    }

    function setGaugeAdapter(address adapter) external onlyOwner {
        gaugeAdapter = IGaugeAdapter(adapter);
        emit GaugeAdapterUpdated(adapter);
    }

    function setDisputeWindow(uint256 newWindow) external onlyOwner {
        if (newWindow == 0 || newWindow > 30 days) revert InvalidAmount();
        disputeWindow = newWindow;
    }

    function setTokenAllowlist(address token, bool allowed, uint256 minDeposit) external onlyOwner {
        if (token == address(0)) revert InvalidAmount();
        if (allowed && minDeposit == 0) revert InvalidAmount();
        allowedToken[token] = allowed;
        minimumDeposit[token] = minDeposit;
        emit TokenAllowlisted(token, allowed, minDeposit);
    }

    function setEpochWindow(uint256 epoch, uint256 depositClose) external onlyOwner {
        if (depositClose <= block.timestamp) revert EpochClosed();
        EpochConfig storage config = epochs[epoch];
        if (config.status != EpochStatus.Open) revert EpochNotOpen();
        config.depositClose = uint64(depositClose);
        emit EpochStateChanged(epoch, EpochStatus.Open, block.timestamp);
    }

    function closeEpoch(uint256 epoch) external onlyOwner {
        EpochConfig storage config = epochs[epoch];
        if (config.status != EpochStatus.Open || config.depositClose == 0 || block.timestamp < config.depositClose) revert EpochNotOpen();
        config.status = EpochStatus.VotingClosed;
        emit EpochStateChanged(epoch, EpochStatus.VotingClosed, block.timestamp);
    }

    function forceCloseEpoch(uint256 epoch) external onlyOwner {
        EpochConfig storage config = epochs[epoch];
        if (config.status != EpochStatus.Open) revert EpochNotOpen();
        config.status = EpochStatus.VotingClosed;
        emit EpochStateChanged(epoch, EpochStatus.VotingClosed, block.timestamp);
    }

    function publishRoot(uint256 epoch, bytes32 root) external onlyPublisher {
        EpochConfig storage config = epochs[epoch];
        if (config.status != EpochStatus.VotingClosed || root == bytes32(0)) revert RootMissing();
        if (config.merkleRoot != bytes32(0)) revert RootAlreadyPublished();
        config.merkleRoot = root;
        config.disputeEnds = uint64(block.timestamp + disputeWindow);
        config.status = EpochStatus.Dispute;
        emit RootPublished(epoch, root, config.disputeEnds);
        emit EpochStateChanged(epoch, EpochStatus.Dispute, block.timestamp);
    }

    function openClaims(uint256 epoch) external onlyOwner {
        EpochConfig storage config = epochs[epoch];
        if (config.status != EpochStatus.Dispute || config.merkleRoot == bytes32(0)) revert ClaimsNotOpen();
        if (block.timestamp < config.disputeEnds) revert DisputeActive();
        config.status = EpochStatus.ClaimsOpen;
        emit EpochStateChanged(epoch, EpochStatus.ClaimsOpen, block.timestamp);
    }

    function setClaimsPaused(bool paused) external onlyGuardian {
        claimsPaused = paused;
        emit ClaimsPauseChanged(paused);
    }

    function depositBribe(uint256 epoch, address gauge, address token, uint256 amount) external nonReentrant {
        EpochConfig storage config = epochs[epoch];
        if (!allowedToken[token]) revert TokenNotAllowed();
        if (config.status != EpochStatus.Open) revert EpochNotOpen();
        if (config.depositClose == 0 || block.timestamp >= config.depositClose) revert EpochClosed();
        if (amount < minimumDeposit[token]) revert InvalidAmount();
        uint256 beforeBalance = IERC20(token).balanceOf(address(this));
        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        uint256 received = IERC20(token).balanceOf(address(this)) - beforeBalance;
        if (received != amount) revert FeeOnTransferUnsupported();
        bribeTotal[epoch][gauge][token] += amount;
        depositedBy[epoch][gauge][token][msg.sender] += amount;
        emit BribeDeposited(msg.sender, epoch, gauge, token, amount);
    }

    function claim(uint256 epoch, address gauge, address token, uint256 amount, bytes32[] calldata proof) external nonReentrant {
        _claim(msg.sender, epoch, gauge, token, amount, proof);
    }

    function _claim(address claimant, uint256 epoch, address gauge, address token, uint256 amount, bytes32[] calldata proof) internal {
        if (claimsPaused) revert ClaimsPaused();
        EpochConfig storage config = epochs[epoch];
        if (config.status != EpochStatus.ClaimsOpen || config.merkleRoot == bytes32(0)) revert ClaimsNotOpen();
        if (claimed[epoch][gauge][token][claimant]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(abi.encode(claimant, epoch, gauge, token, amount));
        if (!_verify(proof, config.merkleRoot, leaf)) revert InvalidProof();
        uint256 total = bribeTotal[epoch][gauge][token];
        if (claimedTotal[epoch][gauge][token] + amount > total) revert ExceedsBribe();
        claimed[epoch][gauge][token][claimant] = true;
        claimedTotal[epoch][gauge][token] += amount;
        if (!IERC20(token).transfer(claimant, amount)) revert TransferFailed();
        emit Claimed(claimant, epoch, gauge, token, amount);
    }

    function claimBatch(
        uint256[] calldata epochIds,
        address[] calldata gauges,
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes32[][] calldata proofs
    ) external nonReentrant {
        if (epochIds.length != gauges.length || gauges.length != tokens.length || tokens.length != amounts.length || amounts.length != proofs.length) revert InvalidAmount();
        for (uint256 i = 0; i < epochIds.length; i++) {
            _claim(msg.sender, epochIds[i], gauges[i], tokens[i], amounts[i], proofs[i]);
        }
    }

    function refundInvalidGauge(uint256 epoch, address gauge, address token) external nonReentrant {
        if (address(gaugeAdapter) == address(0)) revert GaugeAdapterMissing();
        if (gaugeAdapter.isGaugeValid(gauge)) revert GaugeStillValid();
        if (refunded[epoch][gauge][token][msg.sender]) revert NoRefundAvailable();
        uint256 amount = depositedBy[epoch][gauge][token][msg.sender];
        uint256 available = bribeTotal[epoch][gauge][token] - claimedTotal[epoch][gauge][token];
        if (amount > available) amount = available;
        if (amount == 0) revert NoRefundAvailable();
        refunded[epoch][gauge][token][msg.sender] = true;
        depositedBy[epoch][gauge][token][msg.sender] = 0;
        bribeTotal[epoch][gauge][token] -= amount;
        if (!IERC20(token).transfer(msg.sender, amount)) revert TransferFailed();
        emit BribeRefunded(msg.sender, epoch, gauge, token, amount);
    }

    function _verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 sibling = proof[i];
            computed = computed <= sibling
                ? keccak256(abi.encodePacked(computed, sibling))
                : keccak256(abi.encodePacked(sibling, computed));
        }
        return computed == root;
    }
}
