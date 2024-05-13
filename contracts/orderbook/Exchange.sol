// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Orderbook.sol";

contract Exchange is OrderBook {
    uint256 public firstBuyOrderId;
    uint256 public firstSellOrderId;
    uint256 public lastOrderId;

    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function placeBuyOrder(uint256 price, uint256 volume) public {
        require(price > 0, "Invalid Price");
        require(volume > 0, "Invalid Volume");
        require(balanceOf[msg.sender][tokenB] >= price * volume, "Not enough balance");

        lastOrderId++;

        (uint256 remainVolume) = _matchSellOrders(firstSellOrderId, msg.sender, price, volume);

        if (remainVolume > 0) {
            uint256 newFirstBuyOrderId = _insertBuyOrder(firstBuyOrderId, price, remainVolume, msg.sender, lastOrderId);

            if (newFirstBuyOrderId != firstBuyOrderId) {
                firstBuyOrderId = newFirstBuyOrderId;
            }
        }
    }

    function placeSellOrder(uint256 price, uint256 volume) public {
        require(price > 0, "Invalid Price");
        require(volume > 0, "Invalid Volume");
        require(balanceOf[msg.sender][tokenA] >= volume, "Not enough balance");

        lastOrderId++;

        (uint256 remainVolume) = _matchBuyOrders(firstBuyOrderId, msg.sender, price, volume);

        if (remainVolume > 0){
            uint256 newFirstSellOrderId = _insertSellOrder(firstSellOrderId, price, remainVolume, msg.sender, lastOrderId);
            
            if (newFirstSellOrderId != firstSellOrderId) {
                firstSellOrderId = newFirstSellOrderId;
            }
        }        
    }

    function deposit(address token, uint256 amount) public {
        require(token == tokenA || token == tokenB, "Invalid token");
        require(amount > 0, "Invalid amount");

        _deposit(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) public {
        require(token == tokenA || token == tokenB, "Invalid token");
        require(amount > 0, "Invalid amount");
        require(balanceOf[msg.sender][token] >= amount, "Not enough balance");
     
        _withdraw(msg.sender, token, amount);
    }

    function cancelOrder(uint256 orderId, bool isBuyOrder) public {
        Order storage order = isBuyOrder ? buyOrders[orderId] : sellOrders[orderId];

        require(order.trader != address(0), "Order do not exists" );
        require(order.trader == msg.sender, "Only the order creator can cancel this order");
        require(order.volume > 0, "Order already cancelled or fulfilled");

        isBuyOrder 
            ? _cancelBuyOrder(order, firstBuyOrderId)
            : _cancelSellOrder(order, firstSellOrderId);
    }
}
