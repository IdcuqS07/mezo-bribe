// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {BribeMarket} from "../contracts/BribeMarket.sol";
import {MezoGaugeAdapter} from "../contracts/MezoGaugeAdapter.sol";

contract DeployMezoGaugeAdapter is Script {
    address internal constant DEFAULT_VOTER = 0x72F8dd7F44fFa19E45955aa20A5486E8EB255738;
    address internal constant DEFAULT_MARKET = 0xe378E93D5eC4dDa719355c5274d85e97c3a0A500;

    function run() external returns (MezoGaugeAdapter adapter) {
        address voter = vm.envOr("MEZO_VOTER", DEFAULT_VOTER);
        address marketAddress = vm.envOr("BRIBE_MARKET", DEFAULT_MARKET);

        vm.startBroadcast();
        adapter = new MezoGaugeAdapter(voter);
        BribeMarket(marketAddress).setGaugeAdapter(address(adapter));
        vm.stopBroadcast();
    }
}
