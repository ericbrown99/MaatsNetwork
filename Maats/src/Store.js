import React, { Component } from 'react'
import Product from './Product'

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
      indexed: this.props.indexed,
    }
  }

  componentWillMount() {
    this.instantiateStore()

  }

  instantiateStore =() =>{
    const contract = this.state.contract
    const account = this.state.account
    const storeName= this.state.storeName;

    contract.getOwnerFromName(this.state.storeName)
    .then((owner) => {
      return(this.setState({storeOwner:owner}))
    })
    .then(async () => {
      let i = 1;
      let storeAdminsTemp = []
      for(i; i<6; i++){
        storeAdminsTemp[i-1] = await contract.getStoreAdmins(i,storeName, {from: account});
      }
      await console.log(storeName)
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



  /*<div className="field">
    <input className="MaatsAdminAddressAdd" type="text"/>
    <label htmlFor="register">
      <span> New Admin Address </span>
    </label>
  </div>*/

  checkStoreOwnerHandler = () => {
    // render owner functions if its the owner
    const storeName = this.state.storeName;
    const admins = this.state.storeAdmins;

    if(this.state.account === this.state.storeOwner){
      return(
        <div className="storeOwnerFunctionsWrapper">
          <h1> {storeName}Welcome {storeName} Owner! </h1>
          <h4> You can control your store from the functions below </h4>

            <div className="createStoreAdmin">
              <h3> Manage Your Admins</h3>
              <div className="field">
                <input className="StoreAdminAddressAdd" type="text"/>
                <label htmlFor="register">
                  <span> {storeName} Admin Address </span>
                </label>
              </div>
              <button onClick={this.createStoreAdminHandler.bind(this)}>
                Confirm New Admin
              </button>
            </div>
            <div className="removeStoreAdmin">

              <div className="field">
                <input className="StoreAdminAddressRemove" type="text"/>
                <label htmlFor="register">
                  <span> Remove Admin Address </span>
                </label>
              </div>
              <button onClick={this.removeStoreAdminHandler.bind(this)}>
                Confirm Remove Admin
              </button>
            </div>
            <div className="CurrentAdmins">
              <h3> Your current admins </h3>
              <ul>
                <li>{admins[0] != 0 ? admins[0] : "Open Slot"}</li>
                <li>{admins[1] != 0 ? admins[1] : "Open Slot"}</li>
                <li>{admins[2] != 0 ? admins[2] : "Open Slot"}</li>
                <li>{admins[3] != 0 ? admins[3] : "Open Slot"}</li>
                <li>{admins[4] != 0 ? admins[4] : "Open Slot"}</li>
              </ul>
            </div>
            <div className="ChangeProductPrice">
              <h3> Change the price of an existing Product </h3>
              <p> Note: {"You can't change the price of an auction product"} </p>
              <div className="field">
                <input className="priceChangeProductId" type="text"/>
                <label htmlFor="register">
                  <span> ProductId </span>
                </label>
              </div>
              <div className="field">
                <input className="priceChangeNewPrice" type="text"/>
                <label htmlFor="register">
                  <span> {"New Price (Ether)"} </span>
                </label>
              </div>
              <button onClick={this.changeProductPriceHandler.bind(this)}>
                Confirm Price Change
              </button>
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
    let productId = parseInt(document.querySelector(".priceChangeProductId").value,10);
    let newPrice = parseInt(document.querySelector(".priceChangeNewPrice").value,10);

    contract.changePrice(newPrice, productId, {from: account})
    .then(() => alert("Price changed to " + newPrice + " successfully"))
    .catch(() => alert("Couldn't change price. Ensure that the productId is correct and that enough gas was sent with the transaction"));
  }


  checkStoreAdminHandler = () => {
    // render functions for admins/owner if they are current account
    const account = this.state.account
    const admins = this.state.storeAdmins
    const storeName = this.state.storeName
    let res = false

    // check if account is an admin
    for(let item in admins){
      if(admins[item] === account){
        res = true
      }
    }
    // check if account is owner who also has access to owner functions
    account === this.state.storeOwner ? res = true : null ;

    if(res){
      return(
        <div className="storeAdminFunctionsWrapper">
          <h1> Welcome {storeName} Admins! </h1>
          <h4> You can manage products below </h4>
          <div className="createProducts">
            <h3> Create a Set-Price Product </h3>
            <p>  Read: Not an Auction Product </p>
            <div className="field">
              <input className="newProductPrice" type="text" />
              <label htmlFor="register">
                <span> Price (Ether) </span>
              </label>
            </div>
              <div className="field">
                <input className="newProductInventory" type="text" />
                <label htmlFor="register">
                  <span> Initial Product Inventory </span>
                </label>
              </div>
            <button onClick={this.createNewProductHandler.bind(this)}>
              Confirm New Product Creation
            </button>
            <h3> Create an Auction Product </h3>
            <p> Note: This product will have an inventory of 1 and can not have the price changed </p>
            <p> The auction starts at a high price and decends uniformly to a reserve price over time </p>
            <div className="field">
              <input className="auctionStartingPrice" type="text"/>
              <label htmlFor="register">
                <span> Starting Price of Auction (Ether) </span>
              </label>
            </div>
            <div className="field">
              <input className="acutionReservePrice" type="text"/>
              <label htmlFor="register">
                <span> Reserve Price (Ether) </span>
              </label>
            </div>
            <div className="field">
              <input className="auctionDuration" type="text"/>
              <label htmlFor="register">
                <span> Auction Duration (Hours<strong>:</strong> > 1 Minute) </span>
              </label>
            </div>
            <button onClick={this.createNewAuctionHandler.bind(this)}>
              Confirm New Auction Creation
            </button>
          </div>
          <div className="addInventoryWrapper">
            <h3> Add inventory to any Set Price prodcuts </h3>
            <p> Note: you can not add inventory to Auction Products because there is only one for auction </p>
            <div className="field">
              <input className="productInventoryId" type="text"/>
              <label htmlFor="register">
                <span> ProductId Receiving Inventory </span>
              </label>
            </div>
            <div className="field">
              <input className="addedInventoryAmount" type="text"/>
              <label htmlFor="register">
                <span> Amount of New Inventroy </span>
              </label>
            </div>
            <button onClick={this.addInventoryHandler.bind(this)}>
              Confirm Added Inventory
            </button>
          </div>
        </div>
      )
    }

  }

  /* *****
  /* Functions for checkStoreAdminHandler
  /* **** */

  createNewProductHandler = () => {
    // create new product in store
    const contract = this.state.contract
    const account = this.state.account
    const web3 = this.state.web3
    let price = parseInt(document.querySelector(".newProductPrice").value, 10)
    let initialInventory = parseInt(document.querySelector(".newProductInventory").value,10)
    console.log(price)
    console.log(initialInventory)

    price = web3.toWei(price,"ether");

    contract.createSetPriceProduct(price,initialInventory,{from:account})
    .then(() => alert("New product created with price: " + price + " and an initial inventory of: " + initialInventory))
    .catch(() => alert("Couldn't create new product. Ensure that enough gas was sent with transaction."))
  }

  createNewAuctionHandler = () => {
    // create a new auction in store
    const contract = this.state.contract
    const account = this.state.account
    const web3 = this.state.web3
    let initialPrice = parseInt(document.querySelector(".auctionStartingPrice").value,10)
    let reservePrice = parseInt(document.querySelector(".acutionReservePrice").value,10)
    let duration = parseFloat(document.querySelector(".auctionDuration").value,10)
    // blockchain reads duration values in seconds
    let durationSecs = duration * 60 * 60 ;

    contract.createAuctionProduct(web3.toWei(initialPrice,"ether"),web3.toWei(reservePrice,"ether"),durationSecs,{from:account})
    .then(() =>{ alert("Auction successfully created with initial price: "
      + initialPrice + " and reserve price: " + reservePrice
      + "and has a duration of: " + duration + " hours.")})
    .catch(() => {alert("Couldn't create auction. Ensure that duration is greater than 1 minute and that enough gas was sent with the transaction")})
  }

  addInventoryHandler = () => {
    // add inventory to set price products
    const contract = this.state.contract
    const account = this.state.account
    let productId = parseInt(document.querySelector(".productInventoryId").value,10);
    let addedInventory = parseInt(document.querySelector(".addedInventoryAmount").value,10);

    contract.addInventory(productId, addedInventory,{from:account})
    .then(() => alert("Successfully added " + addedInventory + " to the product " + productId + "."))
    .catch(() => alert("Couldn't add inventory. Ensure you have an appropriate product ID and that enough gas was sent with the transaction"))
  }



  /* *****
  /* Functions to render any Products in the store
  /* ***** */

  displayProductsHandler = () => {
    // render the products which are available
    const products = this.state.products;
    const numProducts = this.state.products.length;
    let i = 0;
    let display = false;
    for(i; i<numProducts; i++){
      if(products[i].render){
        display = true;
        return(
          <div className="ReturnedProduct">
          <button className="returnButton" onClick={()=> this.returnHandler(i)}>
            Return To Products
          </button>
            <Product
              productId={i}
              storeName={this.state.storeName}
              web3={this.state.web3}
              contract={this.state.contract}
              account={this.state.account}
              admins={this.state.admins}
              storeOwner={this.state.storeOwner}
              storeNumber={this.state.indexed}
            />
          </div>
        )
      }
    }
    if(!display){
      return(
        <div className="listProducts">
        <h1> Products </h1>
        <ul>
          {products.map((n,index) => {
            return(
              <div key ={index} className="ProductsRendering">
                <div  className="productInList">
                  <button onClick={() => {this.renderProductHandler(n,index)}}>
                  <div className="productImage">
                    <img src={"/store-" + this.state.indexed + "-product-" + index + ".png"}/>
                    <span> Check It Out </span>
                  </div>
                  </button>
                </div>
              </div>
            )
          })}
          </ul>
          </div>
          )
      }
    }



  returnHandler =  (index) =>{
    let tempStores = this.state.stores.slice();
    tempStores[index].render = false;

    this.setState({stores:tempStores})
    .then(this.renderStoreHandler())
  }

  renderProductHandler = (product, index) =>{
    let tempProducts = this.state.products.slice() ;
    tempProducts[index].render = true;
    console.log(tempProducts[index]);
    this.setState({stores: tempProducts})

    // This didn't work to auto render again. Maybe remove return line?
    return(this.displayProductsHandler())
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
            <img src={"/logo-" + this.state.indexed+ ".png"}/>
          </div>
          <div className="productsWrapper">
            <div className="productsDisplayWrapper">
              {this.state.products !== null ?
                <div className="stores-display">
                  {this.state.products < 1  ?
                  <h2> there are no products at this time </h2>
                  :
                  <div> {this.displayProductsHandler()} </div>
                  }
                </div>
                : <div className="loading"> ... loading ... </div>
              }
            </div>
          </div>
          <div className="storeOwnerDisplay">
            {this.state.web3 && this.state.contract  && this.state.storeAdmins ?
             <div>
                {this.checkStoreOwnerHandler()}
              </div>
              : <div className="loading"> ...loading... </div>
            }
          </div>
          <div className="storeAdminDisplay">
            {this.state.web3 && this.state.contract  && this.state.storeAdmins ?
             <div>
                {this.checkStoreAdminHandler()}
              </div>
              : <div  className="loading"> ...loading... </div>
            }
          </div>
        </div>
      </div>
    )
  }

}
export default Store;
