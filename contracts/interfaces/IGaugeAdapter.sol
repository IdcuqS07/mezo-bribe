// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IGaugeAdapter {
    function isGaugeValid(address gauge) external view returns (bool);
}
