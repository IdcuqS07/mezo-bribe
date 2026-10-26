// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract MockGaugeAdapter {
    mapping(address => bool) public valid;

    function setGaugeValid(address gauge, bool isValid) external {
        valid[gauge] = isValid;
    }

    function isGaugeValid(address gauge) external view returns (bool) {
        return valid[gauge];
    }
}
