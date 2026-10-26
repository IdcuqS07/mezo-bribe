// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IGaugeAdapter} from "./interfaces/IGaugeAdapter.sol";

interface IMezoVoter {
    function gauges(address pool) external view returns (address);
    function weights(address pool) external view returns (uint256);
    function isGauge(address gauge) external view returns (bool);
    function isAlive(address gauge) external view returns (bool);
}

/// @notice Read-only bridge from BribeMarket to Mezo's official pool voter.
/// @dev BribeMarket passes its stored pool/gauge key to this adapter. The adapter accepts
///      either a gauge or pool address and resolves pool -> gauge through the official voter.
contract MezoGaugeAdapter is IGaugeAdapter {
    error ZeroAddress();

    IMezoVoter public immutable voter;

    constructor(address voter_) {
        if (voter_ == address(0)) revert ZeroAddress();
        voter = IMezoVoter(voter_);
    }

    function isGaugeValid(address gauge) external view returns (bool) {
        if (voter.isGauge(gauge)) return voter.isAlive(gauge);
        address resolvedGauge = voter.gauges(gauge);
        return resolvedGauge != address(0) && voter.isGauge(resolvedGauge) && voter.isAlive(resolvedGauge);
    }

    function gaugeForPool(address pool) external view returns (address) {
        return voter.gauges(pool);
    }

    function poolWeight(address pool) external view returns (uint256) {
        return voter.weights(pool);
    }
}
