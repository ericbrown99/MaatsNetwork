import React, { Component } from 'react'

class Store extends Component {
  constructor (props) {
    super(props)

    this.state = {
      storeName: this.props.storeName,
      storeOwner: null,
      storeAdmins: null,
      products: null,
      web3: this.props.web3,
      contract: this.props.contract,
      account: this.props.account,
    }
  }

  componentWillMount() {
    this.instantiateStore()

  }

  instantiateStore =() =>{
    const contract = this.state.contract
    const account = this.state.account
    const storeName= this.state.storeName;

    contract.StoreNameToOwner(this.state.storeName)
    .then((owner) => {
      return(this.setState({storeOwner:owner}))
    })
    .then(async () => {
      let i = 1;
      let storeAdminsTemp = []
      for(i; i<6; i++){
        storeAdminsTemp[i-1] = await contract.getStoreAdmins(i,storeName, {from: account});
      }
      return(this.setState({storeAdmins: storeAdminsTemp}))
    })
    .then(() => {
      return(contract.getNumProducts(storeName, {from: account}));
    })
    .then(async (numProducts) => {
      let prodTemp = [];
      let i = 0;
      if(numProducts >0){
        for(i; i<numProducts; i++){
          let tempProd = new Object()
          tempProd.index = await i;
          tempProd.storeName = await storeName;
          tempProd.auction = await contract.getProductType(i,storeName,{from: account});
          tempProd.render = await false;
          prodTemp[i] = await tempProd;
        }
      }
      return this.setState({products: prodTemp})
    })
    .catch(() => {console.log("error instantiating Store Component")});
  }


  checkStoreOwnerHandler = () => {
    // render owner functions if its the owner
    const storeName = this.state.storeName;
    const admins = this.state.storeAdmins;

    if(this.state.account === this.state.storeOwner){
      return(
        <div className="storeOwnerFunctionsWrapper">
          <h1> Store Owner Functions </h1>
          <p> Welcome Owner. You can control your store from the functions below </p>
          <div className="storeOwnerAdminControl">
            <div className="createStoreAdmin">
              <h2> Manage Your Admins</h2>
              <p> Address of new {storeName} Admin </p>
              <input className="StoreAdminAddressAdd" type="text"/>
              <button onClick={this.createStoreAdminHandler.bind(this)}>
                Confirm New Admin
              </button>
            </div>
            <div className="removeStoreAdmin">
              <p> Address of {storeName} admin to remove </p>
              <input className="StoreAdminAddressRemove" type="text"/>
              <button onClick={this.removeStoreAdminHandler.bind(this)}>
                Confirm Remove Admin
              </button>
            </div>
            <div className="currentStoreAdmins">
              <h2> Your current admins </h2>
              <ul>
                <li>{admins[0] != 0 ? admins[0] : "empty"}</li>
                <li>{admins[1] != 0 ? admins[1] : "empty"}</li>
                <li>{admins[2] != 0 ? admins[2] : "empty"}</li>
                <li>{admins[3] != 0 ? admins[3] : "empty"}</li>
                <li>{admins[4] != 0 ? admins[4] : "empty"}</li>
              </ul>
            </div>
            <div className="ChangeProductPrice">
              <h2> Change the price of an existing Product </h2>
              <p> Note: {"you can't change the price of an auction product"} </p>
              <div>
                <p> ProductId </p>
                <input className="priceChangeProductId" type="text"/>
              </div>
              <div>
                <p> New Price </p>
                <input className="priceChangeNewPrice" type="text"/>
              </div>
              <button onClick={this.changeProductPriceHandler.bind(this)}>
                Confirm Price Change
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  /* *****
  /* Functions for checkStoreOwnerHandler
  /* ***** */

  createStoreAdminHandler = () => {
    // add an admin to the store
    const contract = this.state.contract
    const account = this.state.account
    let newStoreAdmin = document.querySelector(".StoreAdminAddressAdd").value

    contract.createStoreAdmin(newStoreAdmin, {from: account})
    .then(() => {alert("New Store Admin Created")})
    .catch(() => {alert("Couldn't create new store Admin. Ensure there is space for a new admin and that enough gas was sent with transaction")})
  }

  removeStoreAdminHandler = () => {
    // remove an admin from the store
    const contract = this.state.contract
    const account = this.state.account
    let oldStoreAdmin = document.querySelector(".StoreAdminAddressRemove").value

    contract.removeStoreAdmin(oldStoreAdmin, {from:account})
    .then(() => {alert("Old Admin Removed")})
    .catch(() =>{alert("Couldn't remove the old admin. Ensure that the address is correct and that enough gas was sent with the transaction")} )
  }

  changeProductPriceHandler = () =>{
    // change the price of an existing product
    const contract = this.state.contract
    const account = this.state.account
    let productId = parseInt(document.querySelector(".priceChangeProductId").value);
    let newPrice = parseInt(document.querySelector(".priceChangeNewPrice").value);

    contract.changePrice(newPrice, productId, {from: account})
    .then(() => alert("Price changed to " + newPrice + " successfully"))
    .catch(() => alert("Couldn't change price. Ensure that the productId is correct and that enough gas was sent with the transaction"));
  }


  checkStoreAdminHandler = () => {
    // render functions for admins/owner if they are current account
    const account = this.state.account
    const admins = this.state.storeAdmins
    let res = false

    // check if account is an admin
    for(let item in admins){
      if(admins[item] === account){
        res = true
      }
    }
    // check if account is owner who also has access to owner functions
    account === this.state.storeOwner ? res = true : null ;

  }

  /* *****
  /* Functions for checkStoreAdminHandler
  /* **** */




  /* *****
  /* Functions to render any Products in the store
  /* ***** */

  displayProductsHandler = () => {
    // render the products which are available
  }



  /* *****
  /* Render the results of store computations
  /* ***** */

  render(){
    // constantly checking for changing metamask account
    if(this.state && this.state.account && this.state.web3){
      var accountInterval = setInterval(() => {
        if (this.state.web3.eth.accounts[0] !== this.state.account) {
          this.setState({account: this.state.web3.eth.accounts[0]})
        }
      }, 100);
    }

    return(
      <div className="storeInstance">
        <div className="storeWrapper">
          <div className="storeHeader">
            <h1> Welcome to {this.props.storeName} </h1>
            <h3> Check out our products below </h3>
          </div>
          <div className="productsWrapper">
            <h2> Products </h2>
            {this.state.products !== null ?
              <div className="stores-display">
                {this.state.products < 1  ?
                <p> there are no products at this time </p>
                :
                <div> {this.displayProductsHandler()} </div>
                }
              </div>
              : <div> ... loading ... </div>
            }
          </div>
          <div className="storeOwnerDisplay">
            {this.state.web3 && this.state.contract  && this.state.storeAdmins ?
             <div>
                {this.checkStoreOwnerHandler()}
              </div>
              : <div> ...loading... </div>
            }
          </div>
          <div className="storeAdminDisplay">
            {this.state.web3 && this.state.contract  && this.state.admins ?
             <div>
                {this.checkStoreAdminHandler()}
              </div>
              : <div> ...loading... </div>
            }
          </div>
        </div>
      </div>
    )
  }

}
export default Store;
