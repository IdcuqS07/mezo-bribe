// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {MezoGaugeAdapter} from "../contracts/MezoGaugeAdapter.sol";

/// @dev Minimal stand-in for the official voter used by adapter unit tests.
contract MockMezoVoter {
    mapping(address => address) public gauges;
    mapping(address => uint256) public weights;
    mapping(address => bool) public isGauge;
    mapping(address => bool) public isAlive;

    function setPoolGauge(address pool, address gauge, bool alive) external {
        gauges[pool] = gauge;
        isGauge[gauge] = true;
        isAlive[gauge] = alive;
    }

    function setPoolMapping(address pool, address gauge) external {
        gauges[pool] = gauge;
    }

    function setGaugeState(address gauge, bool registered, bool alive) external {
        isGauge[gauge] = registered;
        isAlive[gauge] = alive;
    }

    function setPoolWeight(address pool, uint256 weight) external {
        weights[pool] = weight;
    }
}

contract MezoGaugeAdapterTest {
    MockMezoVoter private voter;
    MezoGaugeAdapter private adapter;

    address private constant POOL = address(0xBEEF);
    address private constant GAUGE = address(0xCAFE);
    address private constant UNREGISTERED_GAUGE = address(0xD00D);

    function setUp() public {
        voter = new MockMezoVoter();
        adapter = new MezoGaugeAdapter(address(voter));
    }

    function testLivePoolResolvesToLiveGauge() public {
        voter.setPoolGauge(POOL, GAUGE, true);

        require(adapter.gaugeForPool(POOL) == GAUGE, "pool did not resolve to gauge");
        require(adapter.isGaugeValid(POOL), "live pool should be valid");
    }

    function testLiveGaugeAddressRemainsValid() public {
        voter.setGaugeState(GAUGE, true, true);

        require(adapter.isGaugeValid(GAUGE), "live gauge should be valid");
    }

    function testPoolWithoutResolvedGaugeIsInvalid() public view {
        require(!adapter.isGaugeValid(POOL), "pool without gauge must be invalid");
    }

    function testPoolResolvingToDeadGaugeIsInvalid() public {
        voter.setPoolGauge(POOL, GAUGE, false);

        require(!adapter.isGaugeValid(POOL), "pool with dead gauge must be invalid");
    }

    function testPoolResolvingToUnregisteredGaugeIsInvalid() public {
        voter.setPoolMapping(POOL, UNREGISTERED_GAUGE);
        voter.setGaugeState(UNREGISTERED_GAUGE, false, true);

        require(!adapter.isGaugeValid(POOL), "unregistered resolved address must be invalid");
    }

    function testDeadGaugeAddressIsInvalid() public {
        voter.setGaugeState(GAUGE, true, false);

        require(!adapter.isGaugeValid(GAUGE), "dead gauge must be invalid");
    }

    function testPoolWeightIsReadFromVoter() public {
        voter.setPoolWeight(POOL, 12345);

        require(adapter.poolWeight(POOL) == 12345, "pool weight mismatch");
    }
}
