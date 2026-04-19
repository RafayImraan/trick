// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITRC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract TrickTokenVault {
    address public owner;
    uint256 public totalDeposited;

    mapping(address => mapping(bytes32 => bool)) public usedStealthKeys;
    mapping(address => mapping(address => uint256)) public stealthTokenBalances;

    event TokenDeposit(address indexed token, address indexed depositor, uint256 amount, bytes32 stealthKeyHash);
    event TokenWithdraw(address indexed token, address indexed recipient, uint256 amount, bytes32 stealthKeyHash);
    event TokenStealthKeyUsed(address indexed token, bytes32 keyHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function depositToken(address token, uint256 amount, bytes32 stealthKeyHash) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Zero amount");

        ITRC20 tokenContract = ITRC20(token);

        require(tokenContract.transferFrom(msg.sender, address(this), amount), "TransferFrom failed");

        if (stealthKeyHash != bytes32(0)) {
            require(!usedStealthKeys[token][stealthKeyHash], "Key already used");
            usedStealthKeys[token][stealthKeyHash] = true;
            emit TokenStealthKeyUsed(token, stealthKeyHash);
        }

        stealthTokenBalances[token][msg.sender] += amount;
        totalDeposited += amount;

        emit TokenDeposit(token, msg.sender, amount, stealthKeyHash);
    }

    function withdrawToken(
        address token,
        address payable recipient,
        uint256 amount,
        bytes32 stealthKeyHash
    ) external onlyOwner {
        require(token != address(0), "Invalid token");

        ITRC20 tokenContract = ITRC20(token);
        require(stealthTokenBalances[token][recipient] >= amount, "Insufficient balance");
        require(tokenContract.balanceOf(address(this)) >= amount, "Contract insufficient balance");

        stealthTokenBalances[token][recipient] -= amount;

        require(tokenContract.transfer(recipient, amount), "Transfer failed");

        emit TokenWithdraw(token, recipient, amount, stealthKeyHash);
    }

    function getTokenStealthBalance(address token, address stealthAddress) external view returns (uint256) {
        return stealthTokenBalances[token][stealthAddress];
    }

    function isTokenStealthKeyUsed(address token, bytes32 keyHash) external view returns (bool) {
        return usedStealthKeys[token][keyHash];
    }
}