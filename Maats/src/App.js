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



        // Stores a given value, 5 by default.
        return storeCoreInstance.pause()
      }).then((isPaused) => {
        pause = isPaused

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

  startReadingContract(){
  this.state.contract.pause()
  .then((result) => {console.log(result)})
}

  pausedHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract._pause({from: account})
    .then(() => {
      contract.pause()
      .then((result) => {
        this.setState({paused: true})
      }).then(() =>{
          this.setState({increment: 1})
      })
    })
  }

  unpausedHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract._unpause({from: account})
    .then(() => {
      contract.pause()
      .then((result) =>{
        console.log(result);
        this.setState({paused: false})
        }).then(() =>{
          this.setState({increment: 2})
      })
    })
  }

  newStoreOwnerHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    let newOwnerAddr = document.querySelector('.newStoreOwner').value
    contract.makeStoreOwner(newOwnerAddr, {from: account})
    .then((result) =>{
      let newOwnerId = result.logs[0].args._storeOwnerAddress
      this.setState({storeOwner: newOwnerId })
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

  createAStoreHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]
    let storeName = document.querySelector('.NewStoreName').value

    contract.createStore(storeName, {from: account})

  }

  StoreOpenHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract.openStore({from:account})
    .then(()=>{
      contract.isStoreOpen(account).then((result) => {console.log(result)})
    })
  }


  isStoreOpenHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract.isStoreOpen(account).then((result) =>{console.log(result)})
  }

  NewProductHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]
    let productPrice = document.querySelector('.NewSetPriceProduct').value
    console.log(productPrice)
    let initialInventory = document.querySelector('.initialProductInventory').value
    console.log(initialInventory)

    productPrice = parseInt(productPrice,10)
    initialInventory = parseInt(initialInventory,10)

    contract.createSetPriceProduct(productPrice,initialInventory,{from:account})
  }

  CheckProductExistsHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]
    contract.getProductExists(account,{from: account}).then((result) => {console.log(result)})
  }

  currentInventoryHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract.getCurrentInventory(account,{from:account}).then((result) => {console.log(result.c[0])})
  }

  purchaseProductHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]
    //const storeName = document.querySelector(".storeName").value
    const value1 = this.state.web3.toWei(2,"ether")

    contract.buyItem(0,"Bossy", {value: value1}, {from: account})
    .then(() =>{
      contract.getPurchase(account, {from:account}).then((result) => {console.log(result)})
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
              <button onClick={this.startReadingContract.bind(this)}> reading</button>
              <br/>
              <br/>
              <br/>
              <input className="NewStoreName" type="text"/>
              <button onClick={this.createAStoreHandler.bind(this)}> Create store </button>
              <br/>
              <br/>
              <button onClick={this.StoreOpenHandler.bind(this)}> Open your store</button>
              <button onClick={this.isStoreOpenHandler.bind(this)}> check if store open </button>
              <br/>
              <br/>
              <p>Price of product
              <input className="NewSetPriceProduct" type="text"/>
              </p>
              <p>Initial product inventory
              <input className="initialProductInventory" type="text"/>
              </p>
              <br/>
              <button onClick={this.NewProductHandler.bind(this)}> Create New Product </button>
              <button onClick={this.CheckProductExistsHandler.bind(this)}> Check if owner has a product</button>
              <br/>
              <br/>
              <button onClick={this.currentInventoryHandler.bind(this)}> Get Current Inventory</button>
              <br/>
              <br/>
              <p> Purchase Product </p>
              <p> storeName </p>
              <input className="storeName" type="text"/>
              <button onClick={this.purchaseProductHandler.bind(this)}> Purchase Product </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
