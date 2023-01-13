import React, { Component } from 'react';
import Web3 from 'web3';
import Token from '../abis/Token.json';
import EthSwap from '../abis/EthSwap.json';
import Navbar from './NavBar';
import Main from './main';
import './App.css';

class App extends Component {
  
  async componentWillMount(){
    await this.loadWeb3();
    await this.loadBLockchainData();
    console.log(window.web3);
  }

  async loadBLockchainData(){

    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0]});
    console.log("Account No : ",this.state.account);

    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ethBalance});
    console.log("Balance : ",this.state.ethBalance);

    const networkId = await web3.eth.net.getId();

    //Load Token
    try {
      const tokenData = Token.networks[networkId];
      const token = new web3.eth.Contract(Token.abi, tokenData.address);
      token.address = tokenData.address;
      this.setState({token});
      const tokenBalance = await token.methods.balanceOf(this.state.account).call();
      this.setState({tokenBalance: tokenBalance.toString()});
      console.log("Token Contract : ",this.state.token);
      console.log("Token Balance : ",this.state.tokenBalance);
    } catch (error) {
      window.alert('Token contract not deployed on detected Network!!',error);      
      console.log(error);
    }

     //Load EthSwap
     try {
      const ethSwapData = EthSwap.networks[networkId];
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address);
      ethSwap.address = ethSwapData.address;
      this.setState({ethSwap});
      console.log("EthSwap Contract : ",this.state.ethSwap);
    } catch (error) {
      window.alert('EthSwap contract not deployed on detected Network!!',error);      
      console.log(error);
    }
    this.setState({loading: false});
  }

  async loadWeb3(){
    if (window.ethereum){
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }else if (window.web3){
      window.web3 = new Web3(window.web3.currentProvider)
    }else{
      window.alert("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
  }

  buyTokens = async (etherAmount) => {
    this.setState({loading: true});
    await this.state.ethSwap.methods.buyTokens()
      .send({value: etherAmount,from: this.state.account})
      .on('transactionHash',(hash)=>{
        this.setState({loading: false});
      });
  }

  sellTokens = async (tokenAmount) => {
    this.setState({loading: true});
    await this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount)
      .send({from: this.state.account})
      .on('transactionHash',(hash)=>{
        this.state.ethSwap.methods.sellTokens(tokenAmount)
          .send({from: this.state.account})
          .on('transactionHash',(hash)=>{
            this.setState({loading: false});
          });
      });
  }
  
  constructor(props) {
    super(props);
    this.state = {
      account: '',
      token:{},
      ethBalance: '0',
      tokenBalance: '0',
      ethSwap:{},
      loading: true
    };
  }

  render() {
    let content;
    if(this.state.loading){
      content = <p id="loader" className='text-center'>Loading.....</p>
    }else{
      content = <Main
        ethBalance={this.state.ethBalance}
        tokenBalance={this.state.tokenBalance}
        buyTokens={this.buyTokens}
        sellTokens={this.sellTokens}
      />
    }

    return (
      <div>
        <Navbar account={this.state.account}/>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{maxWidth: '600px'}}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>
                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;