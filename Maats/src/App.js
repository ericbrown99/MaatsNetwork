import React, { Component } from 'react'
import StoreCoreContract from '../build/contracts/StoreCore.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      web3: null,
      contract: 0,
      account: null,
      paused: null,
      increment: 0,
      storeOwner: 0
    }
  }



  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })


      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')

    const StoreCore = contract(StoreCoreContract)


    StoreCore.setProvider(this.state.web3.currentProvider)



    // Declaring this for later so we can chain functions on SimpleStorage.
    var storeCoreInstance
    var pause
   // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      StoreCore.deployed().then( (instance) => {
        storeCoreInstance = instance
        //insert some logic to test contract below;
        //return owner?
        console.log(storeCoreInstance)


        // Stores a given value, 5 by default.
        return storeCoreInstance.pause()
      }).then((isPaused) => {
        pause = isPaused
        console.log(pause)

        return storeCoreInstance.maatsOwner()
      }).then((result) => {

        // Update state with the result.
        return this.setState({
          storageValue: result,
          contract: storeCoreInstance,
          account: accounts[0],
          paused: pause
      })
    })
  })
}


  pausedHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract._pause({from: account})
    .then(() => {
      this.setState({paused: contract.pause()})
    }).then(() =>{
        this.setState({increment: 1})
    })
  }

  unpausedHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract._unpause({from: account})
    .then(() => {
      this.setState({paused: contract.pause()})
      }).then(() =>{
        this.setState({increment: 2})
    })
  }

  newStoreOwnerHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    let newOwnerAddr = document.querySelector('.newStoreOwner').value
    contract.makeStoreOwner(newOwnerAddr, {from: account})
    .then((result) =>{
      this.setState({storeOwner: result + 1})

    })

  }


  ownerChangeHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    let ownerAddr = document.querySelector('.ownerInput').value
    contract.setMaatsOwner(ownerAddr, {from: account})
    .then(() => {
      this.setState({storageValue : ownerAddr})
    })
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Network Connected!</h1>
              <p>Your Truffle Box is installed and ready.</p>
              <h2>Test Proper Ownership/Initialization</h2>
              <p>When contracts compiled and migrated successfully, below will show the address of the
              contract owner</p>
              <p> If the addresses match,React is properly accessing & reading from the blockchain app</p>
              <p>The owner should be  :  0x575c5e24c84bf85ecba20c78ea7e2a218e8079e5</p>
              <p>The contract owner is: {this.state.storageValue}</p>
              <p> The contract is: {this.state.paused ? "Paused" : "unPaused"}</p>
              <p> The increment state is: {this.state.increment} </p>
              <input className="ownerInput" type="text"/>
              <button onClick={this.ownerChangeHandler.bind(this)} > Change Owner </button>
              <br/>
              <br/>
              <button onClick={this.pausedHandler.bind(this)}> Pause Contract </button>
              <button onClick={this.unpausedHandler.bind(this)}> Unpause Contract </button>
              <br/>
              <br/>
              <input className="newStoreOwner" type="text"/>
              <button onClick={this.newStoreOwnerHandler.bind(this)}> Create Owner </button>
              <p> There is a store owner: {this.state.storeOwner } </p>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
