import React, { Component } from 'react'
import StoreCoreContract from '../build/contracts/StoreCore.json'
import EscrowContract from '../build/contracts/Escrow.json'
import getWeb3 from './utils/getWeb3'
import Store from './Store'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      maatsOwnerAddress: 0,
      web3: null,
      contract: 0,
      account: null,
      paused: null,
      escrow:0,
      stores: null,
      admins: null,
      /*
      increment: 0,
      storeOwner: 0,

      */
    }
  }


  componentWillMount  () {
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

  instantiateContract = () => {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */


    const contract = require('truffle-contract')
    const StoreCore = contract(StoreCoreContract)
    const Escrow = contract(EscrowContract)


    StoreCore.setProvider(this.state.web3.currentProvider)
    Escrow.setProvider(this.state.web3.currentProvider)



    // Declaring this for later so we can chain functions on SimpleStorage.
    let storeCoreInstance
    let pause
    let maatsOwner

   // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      StoreCore.deployed().then((instance) => {
        storeCoreInstance = instance
        //insert some logic to test contract below;
        //return owner?



        // Stores a given value, 5 by default.
        return storeCoreInstance.pause()
      }).then((isPaused) => {
        pause = isPaused

        return storeCoreInstance.maatsOwner()
      }).then((result) => {

        maatsOwner = result

        return Escrow.deployed()
      }).then((instance) => {

        // Update state with the result.
        return this.setState({
          maatsOwnerAddress: maatsOwner,
          contract: storeCoreInstance,
          account: accounts[0],
          paused: pause,
          escrow: instance
        })
      })
      .then(() =>{
        // get all stores from contract
        return storeCoreInstance.getNumStores({from:accounts[0]})
      }).then( async (numStores) => {
        let storesTemp = []
        let i=0;
        if(numStores > 0){
          for(i; i < numStores; i++){
            let tempObj = new Object()
            tempObj.name = await storeCoreInstance.getStoreName(i, {from:accounts[0]});
            tempObj.render = await false;
            storesTemp[i] = await tempObj;
          }
        }
        return this.setState({stores: storesTemp})
      }).then(async () =>{
        let adminsTemp = []
        let i = 0
        for(i; i<5; i++){
          adminsTemp[i] = await storeCoreInstance.maatsAdmins(i, {from: accounts[0]});
        }
        return this.setState({admins: adminsTemp})
    /*  }).catch(() =>{
        console.log("error in instantiate contract")*/
      })
    })
  }



checkMaatsOwnerHandler () {
  let admins = this.state.admins
  if(this.state.account  === this.state.maatsOwnerAddress){
      return(
        <div className="MaatsOwnerFunctions">
          <br/>
          <br/>
          <h1> Owner Functions </h1>
          <div className="PauseToggleButton">
            <button onClick={this.togglePauseHandler.bind(this)}>
              {this.state.paused ? "Unpause Network" : "Pause Network"}
            </button>
          </div>
          <div className="CreateAdmins">
            <h3> Manage Admins </h3>
            <p> Address of new Maats Admin </p>
            <input className="MaatsAdminAddressAdd" type="text"/>
            <button onClick={this.createMaatsAdminHandler.bind(this)}>
              Create New Maats admin
            </button>
          </div>
          <div className="RemoveAdmins">
            <p> Address of admin to remove </p>
            <input className="MaatsAdminAddressRemove" type="text"/>
            <button onClick={this.removeMaatsAdminHandler.bind(this)}>
              Remove Maats Admin
            </button>
          </div>
          <div className="CurrentAdmins">
            <h3> Current Admins </h3>
            <ul>
            <li>{admins[0] != 0 ? admins[0] : "empty"}</li>
            <li>{admins[1] != 0 ? admins[1] : "empty"}</li>
            <li>{admins[2] != 0 ? admins[2] : "empty"}</li>
            <li>{admins[3] != 0 ? admins[3] : "empty"}</li>
            <li>{admins[4] != 0 ? admins[4] : "empty"}</li>
            </ul>
          </div>
          <div className="changeOwner">
            <h3> Change the current Maats Owner </h3>
            <input className="newMaatsOwner" type="text"/>
            <button onClick={this.changeMaatsOwnerHandler.bind(this)}>
              Confirm Change
            </button>
          </div>
          <div className="fundsWithdrawl">
            <h3> Withdraw funds in Maats </h3>
            <br/>
            <button onClick={this.withdrawHandler.bind(this)}>
              Confirm withdraw
            </button>
          </div>
        </div>
      )
    }
  }

/* *****
/* Functions used in CheckMaatsOwnerHandeler
/* *****/

  togglePauseHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.account
    let current;
    if(this.state.paused) {
      contract._unpause({from: account})
      .then(() => {current = false})
    } else {
      contract._pause({from: account})
      .then(() => {current=true})
    }
      this.setState({paused: current})
  }

  createMaatsAdminHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.account
    let newAdmin = document.querySelector(".MaatsAdminAddressAdd").value

    contract.createMaatsAdmin(newAdmin, {from:account})
      .catch(() =>{
        console.log("Couldn't Create New Admin")
      })
  }


  removeMaatsAdminHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.account
    let oldAdmin = document.querySelector(".MaatsAdminAddressRemove").value

    contract.removeMaatsAdmin(oldAdmin, {from:account})
      .catch(() => {
        console.log("couldn't remove old admin")
      })
  }

  changeMaatsOwnerHandler = (event) =>{
    let contract = this.state.contract
    let account = this.state.account
    let newOwnerAddress = document.querySelector(".newMaatsOwner").value

    contract.setMaatsOwner(newOwnerAddress, {from: account})
    .then(() => {
      this.setState(this.maatsOwnerAddress: newOwnerAddress)
    })
    .catch(() =>{
      console.log("couldn't change maats owner")
    })
  }

  withdrawHandler = (event) =>{
    const account = this.state.account
    this.state.contract.withdraw({from:account})
  }




/* *****
/* ***** Check if current account is maats admin
/* ***** */

  checkMaatsAdminHandler () {
    const account =  this.state.account
    const admins = this.state.admins
    let res = false

    // check if account is an admin
    for(let item in admins){
      if(admins[item] === account){
        res = true
      }
    }
    // check if account is owner who also has access to owner functions
    account === this.state.maatsOwnerAddress ? res = true : null ;


    if(res){
      return(
        <div className="checkAdminHandlerWrapper">
          <div className="AdminFunctions">
            <h1> Admin Functions </h1>
              <div className="createStoreOwner">
                <h3> Create Store Owner </h3>
                <p> Input the address of the new Owner </p>
                <input className="newStoreOwnerAddress" type="text" />
                <p> {"Input the new owner's requested store name" }</p>
                <input className="newStore" type="text"/>
                <button onClick={this.createNewStoreOwnerHandler.bind(this)}> Create Owner </button>
                <h3> Remove Store and Owner </h3>
                <input className="removeStoreOwner" type="text" />
                <button onClick={this.removeStoreOwnerHandler.bind(this)}> Remove Store & Owner </button>
              </div>
          </div>
        </div>
      )
    }
  }

/* *****
/* Functions for checkAdminHandler
/* ***** */

  checkIfAdmin = async () => {
    const contract =  this.state.contract
    const account =  this.state.account

    let res = await contract.getIsAdmin(account, {from:account})

    if (res === false){
      if (account === this.state.maatsOwnerAddress){
        res = true;
      }
    }
    return res;
  }

  createNewStoreOwnerHandler = () => {
    const contract = this.state.contract
    const account = this.state.account
    let newOwner = document.querySelector(".newStoreOwnerAddress").value
    let newName = document.querySelector(".newStore").value

    contract.makeStoreOwner(newOwner,newName, {from: account})
    .then(() => {alert("New owner " + newOwner + " has been created!")})
    //.catch(() =>{alert("New owner couldn't be created")})
  }

  removeStoreOwnerHandler = () => {
    const contract = this.state.contract
    const account = this.state.contract
    let StoreRemove = document.querySelector(".removeStoreOwner").value

    contract.removeStoreOwner(StoreRemove, {from:account})
    .then(() => {alert("Old Store " + StoreRemove + " has been removed" )})
    .catch(() => {alert("Store " + StoreRemove + "COULDN'T be removed")})
  }


  displayStoresHandler = () => {
    const stores = this.state.stores;

    return(
      <div>
      The open stores
      <ul>
        {stores.map((n,index) => {
          return(
            //add conditional if here to render
            n.render ?
              <div key={n*10}>
                <p> conditional render works!! </p>
                <Store
                  storeName={n.name}
                  web3={this.state.web3}
                  contract={this.state.contract}
                  account={this.state.account} />
              </div>
            :
              <div key={n}>
              <button onClick={() => {this.renderStoreHandler(n,index)}}> Go to {n.name} </button>
              </div>
          )
        })}
      </ul>
      </div>
    );
  }

  renderStoreHandler = (instance,index) => {
    console.log(this.state.stores[index].render);
    console.log(index);
    let tempStores = this.state.stores.slice() ;
    tempStores[index].render = true;
    this.setState({stores: tempStores})

  }

  render() {

    // Constantly checking for an metaMask account change
    if(this.state && this.state.account && this.state.web3){
      var accountInterval = setInterval(() => {
        if (this.state.web3.eth.accounts[0] !== this.state.account) {
          this.setState({account: this.state.web3.eth.accounts[0]})
        }
      }, 100);
    }


    return (
      <div className="App">

        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link"> Maats </a>
        </nav>
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Shop <br/> Women & Minority <br/> Owned </h1>
              <p>
                "Women and minorities are vital parts of our communities, yet there  are still many barriers which prevent them from realizing their true potential.We hope that the Maat’s platform can help our comunities take a smallstep in the right direction by empowering women and minority owners.Here, owner’s will realize 100% of their revenue."
              </p>
              <h2>Stores</h2>
              <div>
                {this.state.stores !== null ?
                  <div className="stores-display">
                    {this.state.stores < 1  ?
                    <p> there are no stores at this time </p>
                    :
                    <div> {this.displayStoresHandler()} </div>
                    }
                  </div>
                  : <div> ... loading ... </div>
                }
              </div>
              <div className="owner-display">
                {this.state.web3 && this.state.contract  && this.state.admins ?
                 <div>
                    {this.checkMaatsOwnerHandler()}
                  </div>
                  : <div> ...loading... </div>
                }
              </div>

              <div className="admin-display">
                {this.state.web3 && this.state.contract ?
                 <div>
                    {this.checkMaatsAdminHandler()}
                 </div>
                  : <div> ...loading... </div>
                }
              </div>

            {/*  <div className="maatsOwnerAccess">
              //display owner only functions if owner
              /*{this.checkMaatsOwnerHandler().bind(this)}
              </div>
              <div className="maatsAdminAccess">
              //display owner/admin functions if owner/admin
            /*  {this.checkMaatsAdminHandler().bind(this)}

              </div>*/}


            {/*  <p>When contracts compiled and migrated successfully, below will show the address of the
              contract owner</p>
              <p> If the addresses match,React is properly accessing & reading from the blockchain app</p>
              <p>The owner should be  :  0x575c5e24c84bf85ecba20c78ea7e2a218e8079e5</p>
              <p>The contract owner is: {this.state.storageValue}</p>
              <p> The contract is: {this.state.paused ? "Paused" : "unPaused"}</p>
              <p> The increment state is: {this.state.increment} </p>
              <p> Set Escrow contract  :
              <button onClick={this.setEscrowHandler.bind(this)}> Set Escrow Contract </button>
              </p>
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
              <br/>
              <br/>
              <button onClick={this.getPurchaseHandler.bind(this)}> Get Purchase </button>
              <br/>
              <br/>
              <p> Ship product to purchaser</p>
              <p> Product to ship
              <input className="shipProductIndex" type="text"/>
              </p>
              <p> Item instance to ship
              <input className="shipItemIndex" type="text"/>
              </p>
              <button onClick={this.shipProductHandler.bind(this)}> Ship purchase</button>
              <button onClick={this.productStatusHandler.bind(this)}> Shipped? </button>
              */}
            </div>
          </div>
        </main>
      </div>
    );
  }
}
/*
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

  setEscrowHandler = (event) =>{
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]
    const escrow = this.state.escrow

    contract.setEscrowAddress(escrow.address, {from: account})
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
    let initialInventory = document.querySelector('.initialProductInventory').value

    productPrice = this.state.web3.toWei(parseInt(productPrice,10), "ether")
    console.log(productPrice)
    initialInventory = parseInt(initialInventory,10)
    console.log(initialInventory)

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
    contract.findFirstItemForSale(0,"Bossy").then((result) => {console.log(result.c[0])})
    //const storeName = document.querySelector(".storeName").value
    const value1 = this.state.web3.toWei(2,"ether")

    contract.buyItem(0,"Bossy", {value: value1, from: account})
    .then(() =>{
      contract.getPurchase(account, {from:account}).then((result) => {console.log(result)})
    })
  }

  getPurchaseHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]

    contract.getPurchase(account,{from:account}).then((result) => {console.log(result.c[0])})
  }

  shipProductHandler = (event) => {
    const contract = this.state.contract
    const account = this.state.web3.eth.accounts[0]
    let productId = document.querySelector(".shipProductIndex").value
    let itemId = document.querySelector(".shipItemIndex").value

    contract.shipItem(productId, itemId, {from: account})
  }

  productStatusHandler = (event) =>{

  }





*/

export default App
