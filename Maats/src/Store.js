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
      index: this.props.index,
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


  checkStoreOwnerHandler = () => {
    // render owner functions if its the owner
    const storeName = this.state.storeName;
    const admins = this.state.storeAdmins;

    if(this.state.account === this.state.storeOwner){
      return(
        <div className="storeOwnerFunctionsWrapper">
          <h1> {storeName} Owner Functions </h1>
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
          <h1> {storeName} Admin Functions </h1>
          <p> Admins can manage products below </p>
          <div className="createProducts">
            <h3> Create a Set Price Product </h3>
            <p> This is a standard product as opposed to an Auction Product </p>
            <h4> Set the price (in Ether) for your new product </h4>
            <input className="newProductPrice" type="text" />
            <h4> Input your current inventory of the product </h4>
            <input className="newProductInventory" type="text" />
            <button onClick={this.createNewProductHandler.bind(this)}>
              Confirm New Product Creation
            </button>
            <h3> Create an Auction Product </h3>
            <p> This product will have an inventory of 1 and can not have the price changed </p>
            <p> The auction starts at a high price and decends uniformly to a reserve price over time </p>
            <h4> Set the starting price for the auction </h4>
            <input className="auctionStartingPrice" type="text"/>
            <h4> Set the reserve price for the auction </h4>
            <input className="acutionReservePrice" type="text"/>
            <h4>{"Set the duration of your auction in HOURS (must be at least 1/60th of an hour)"}</h4>
            <input className="auctionDuration" type="text"/>
            <button onClick={this.createNewAuctionHandler.bind(this)}>
              Confirm New Auction Creation
            </button>
          </div>
          <div className="addInventoryWrapper">
            <h3> Add inventory to any Set Price prodcuts </h3>
            <p> Note: you can not add inventory to Auction Products because there is only one for auction </p>
            <h4> ProductId of product receiving more inventory </h4>
            <input className="productInventoryId" type="text"/>
            <h4> Amount of new inventory </h4>
            <input className="addedInventoryAmount" type="text"/>
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
    return(
      <div>
      Check out these products!
      <ul>
        {products.map((n,index) => {
          return(
            //add conditional if here to render
            n.render ?
              <div key={index*10}>
                <p> conditional product render works!! </p>
                <Product
                  productId={n.index}
                  storeName={this.state.storeName}
                  web3={this.state.web3}
                  contract={this.state.contract}
                  account={this.state.account}
                  admins={this.state.admins}
                  storeOwner={this.state.storeOwner}
                />
              </div>
            :
              <div key={index}>
              <button onClick={() => {this.renderProductHandler(n,index)}}> Check Out Product: {n.index} </button>
              </div>
          )
        })}
      </ul>
      </div>
    );
  }

  renderProductHandler = (product, index) =>{
    let tempProducts = this.state.products.slice() ;
    tempProducts[index].render = true;
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
            <img src={"/logo-" + this.state.index+ ".png"}/>
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
              : <div> ...loading </div>
            }
          </div>
          <div className="storeAdminDisplay">
            {this.state.web3 && this.state.contract  && this.state.storeAdmins ?
             <div>
                {this.checkStoreAdminHandler()}
              </div>
              : <div> loading... </div>
            }
          </div>
        </div>
      </div>
    )
  }

}
export default Store;
