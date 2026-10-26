// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {BribeMarket} from "../contracts/BribeMarket.sol";

contract DeployBribeMarket is Script {
    function run() external returns (BribeMarket market) {
        vm.startBroadcast();
        address deployer = tx.origin;
        address publisher = vm.envOr("PUBLISHER", deployer);
        address musd = vm.envOr("MUSD_TOKEN", address(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503));
        address mezo = vm.envOr("MEZO_TOKEN", address(0x7B7c000000000000000000000000000000000001));
        uint256 minDeposit = vm.envOr("BRIBE_MIN_DEPOSIT_WEI", uint256(100 ether));
        uint256 disputeWindow = vm.envOr("DISPUTE_WINDOW_SECONDS", uint256(1 days));

        market = new BribeMarket(publisher);
        market.setTokenAllowlist(musd, true, minDeposit);
        market.setTokenAllowlist(mezo, true, minDeposit);
        market.setDisputeWindow(disputeWindow);
        vm.stopBroadcast();
    }
}
