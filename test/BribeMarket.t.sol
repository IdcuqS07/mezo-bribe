// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {BribeMarket} from "../contracts/BribeMarket.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockGaugeAdapter} from "../contracts/mocks/MockGaugeAdapter.sol";

interface Vm {
    function warp(uint256 timestamp) external;
    function expectRevert(bytes4 selector) external;
}

contract BribeMarketTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    BribeMarket internal market;
    MockERC20 internal token;
    address internal gauge = address(0xBEEF);
    uint256 internal constant EPOCH = 42;

    function setUp() public {
        market = new BribeMarket(address(this));
        token = new MockERC20();
        token.mint(address(this), 10_000 ether);
        token.approve(address(market), type(uint256).max);
        market.setTokenAllowlist(address(token), true, 100 ether);
        market.setEpochWindow(EPOCH, block.timestamp + 1 days);
    }

    function testDepositStoresTotal() public {
        market.depositBribe(EPOCH, gauge, address(token), 500 ether);
        require(market.bribeTotal(EPOCH, gauge, address(token)) == 500 ether, "total mismatch");
        require(token.balanceOf(address(market)) == 500 ether, "escrow mismatch");
    }

    function testLifecycleAndClaim() public {
        market.depositBribe(EPOCH, gauge, address(token), 500 ether);
        market.forceCloseEpoch(EPOCH);
        bytes32 leaf = keccak256(abi.encode(address(this), EPOCH, gauge, address(token), 125 ether));
        market.publishRoot(EPOCH, leaf);
        vm.warp(block.timestamp + 1 days + 1);
        market.openClaims(EPOCH);
        uint256 beforeBalance = token.balanceOf(address(this));
        bytes32[] memory proof = new bytes32[](0);
        market.claim(EPOCH, gauge, address(token), 125 ether, proof);
        require(token.balanceOf(address(this)) == beforeBalance + 125 ether, "claim mismatch");
        vm.expectRevert(BribeMarket.AlreadyClaimed.selector);
        market.claim(EPOCH, gauge, address(token), 125 ether, proof);
    }

    function testPauseClaims() public {
        market.depositBribe(EPOCH, gauge, address(token), 500 ether);
        market.forceCloseEpoch(EPOCH);
        bytes32 leaf = keccak256(abi.encode(address(this), EPOCH, gauge, address(token), 125 ether));
        market.publishRoot(EPOCH, leaf);
        vm.warp(block.timestamp + 1 days + 1);
        market.openClaims(EPOCH);
        market.setClaimsPaused(true);
        bytes32[] memory proof = new bytes32[](0);
        vm.expectRevert(BribeMarket.ClaimsPaused.selector);
        market.claim(EPOCH, gauge, address(token), 125 ether, proof);
    }

    function testInvalidGaugeRefundReturnsToDepositor() public {
        market.depositBribe(EPOCH, gauge, address(token), 500 ether);
        MockGaugeAdapter adapter = new MockGaugeAdapter();
        market.setGaugeAdapter(address(adapter));
        uint256 beforeBalance = token.balanceOf(address(this));
        market.refundInvalidGauge(EPOCH, gauge, address(token));
        require(token.balanceOf(address(this)) == beforeBalance + 500 ether, "refund mismatch");
        require(market.bribeTotal(EPOCH, gauge, address(token)) == 0, "refund total mismatch");
        require(market.depositedBy(EPOCH, gauge, address(token), address(this)) == 0, "depositor balance mismatch");
    }
}
