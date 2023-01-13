const { assert } = require('chai');
const Web3 = require('web3');

// Mocha and chai
const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require('chai')
    .use(require('chai-as-promised'))
    .should();

contract('EthSwap', ([deployer, investor])=>{

    let token, ethSwap;

    function tokens(n) {
        return Web3.utils.toWei(n,'ether');
    }
    
    before(async ()=>{
        token = await Token.new();
        ethSwap = await EthSwap.new(token.address);
        await token.transfer(ethSwap.address,tokens('1000000'));
    });

    describe('Token deployment', async ()=>{

        it('contract has a name', async()=>{
            const name = await token.name();
            assert.equal(name,'DApp Token');
        });
    });

    describe('EthSwap deployment', async ()=>{

        it('contract has a name', async()=>{
            const name = await ethSwap.name();
            assert.equal(name,'EthSwap Instant Exchange');
        });

        it('contract has Tokens', async()=>{
            var balance = await token.balanceOf(ethSwap.address);
            balance = balance.toString();
            assert.equal(balance,tokens('1000000'));
        });
    });

    describe('buyTokens()', async ()=>{
        it('Allows users to instantly purchase tokens from ethSwap for a fixed price', async ()=>{
            let result = await ethSwap.buyTokens({from: investor, value: tokens('1')});
            let balance = await token.balanceOf(investor);
            assert.equal(balance.toString(), tokens('100'));

            let ethSwapBalance = await token.balanceOf(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('999900'));

            ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('1'));

            const event = result.logs[0].args;
            assert.equal(event.account, investor);
            assert.equal(event.token, token.address);
            assert.equal(event.amount.toString(), tokens('100').toString());
            assert.equal(event.rate.toString(), '100');
        });
    });

    describe('sellTokens()', async ()=>{
        it('Allows users to instantly sell tokens to ethSwap for a fixed price', async ()=>{
            await token.approve(ethSwap.address, tokens('100'), {from: investor});
            let result = await ethSwap.sellTokens(tokens('100'),{from: investor});

            let balance = await token.balanceOf(investor);
            assert.equal(balance.toString(), tokens('0'));

            let ethSwapBalance = await token.balanceOf(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('1000000'));

            ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('0'));

            const event = result.logs[0].args;
            assert.equal(event.account, investor);
            assert.equal(event.token, token.address);
            assert.equal(event.amount.toString(), tokens('100').toString());
            assert.equal(event.rate.toString(), '100');

            await ethSwap.sellTokens(tokens('500'),{from: investor}).should.be.rejected;
        });
    });
});