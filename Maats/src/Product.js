import React, { Component } from 'react'

let BigNumber = require('bignumber.js')


class Product extends Component {
  constructor (props){
    super(props)

    this.state = {
      productId: this.props.productId,
      storeName: this.props.storeName,
      web3: this.props.web3,
      contract: this.props.contract,
      account: this.props.account,
      admins: this.props.admins,
      storeOwner: this.props.storeOwner,
      auctionId: null,
      price: null,
      reservePrice: null,
      duration: null,
      inventory: null,
      itemsBought: null,
    }
  }

  componentWillMount() {
    this.instantiateProduct()
  }

  instantiateProduct = () => {
    const contract = this.state.contract
    const account = this.state.account
    const storeName = this.state.storeName
    const productId = this.state.productId
    let auctionId;

    //check if it is an auction or not
    contract.getAuctionId(storeName, productId,{from: account})
    .then((result) => {
      this.setState({auctionId: result})
      return(auctionId = result)
    })
    .then(async (result) => {
      if(auctionId == 0){
        let tempInventory = await contract.getCurrentInventory(storeName,productId,{from:account})
        let tempPrice =  await contract.getCurrentSetPrice(storeName,productId,{from:account})
        return(await this.setState({
          price:tempPrice,
          inventory: tempInventory,
        }))
      }else{
        if(await contract.didBid(this.state.storeOwner,productId, 0)){
          return("*")
        }else{
          let tempPrice = await contract.getCurrentPrice(result,{from:account});
          let tempDuration = await contract.getDuration(result,{from:account});
          let tempReservePrice = await contract.getReservePrice(result,{from:account});
          await console.log(tempReservePrice)
          await console.log(tempDuration)
          await console.log(tempPrice.toNumber())
          return(await this.setState({
            price:tempPrice,
            duration: tempDuration,
            reservePrice: tempReservePrice,
            inventory: 1,
          }))
        }
      }
    })
    .then(async () => {
      // initiate items array
      let tempItemsBought = []
      let i = 0;
      let numItems = await contract.getItemLength(storeName,productId,{from:account});
      if(numItems > 0){
        for(i; i< numItems; i++){
          let test = await contract.getItemBought(storeName,productId, i, {from:account})
          if(test){
            await tempItemsBought.push(i);
          }
        }
      }
      return(await this.setState({itemsBought: tempItemsBought}))
    })
    /*.catch(() => console.log("error setting up product"))*/
  }

  checkAdminOwnerProductHandler = () =>{
    const account = this.state.account
    const admins = this.state.storeAdmins
    const storeName = this.state.storeName
    let res = false
    const itemsBought = this.state.itemsBought

    // check if account is an admin
    for(let item in admins){
      if(admins[item] === account){
        res = true
      }
    }
    // check if account is owner who also has access to owner functions
    account === this.state.storeOwner ? res = true : null ;
    console.log(this.state.storeOwner)
    if(res){
      return(
      <div className="product functionalities">
        <h2> Ship Purchased Items To Receive Funds</h2>
        <ul>
          {itemsBought.map((n,index) => {
            return(
                <div key={index}>
                <button onClick={() => {this.shipProductHandler(n)}}> Ship Product Item {n} </button>
                </div>
            )
          })}
        </ul>
      </div>
    )
    }
  }

  shipProductHandler = (n) =>{
    const contract = this.state.contract
    const account = this.state.account
    const item = n
    const productId = this.state.productId

    contract.shipItem(item,productId, {from:account})
    .then(() => alert("Product item " + item + " has been shipped!"))
    .catch(() => alert("Couldn't ship product item " + item + ". Please ensure enough gas is sent with transaction and reload page before attempting again."))
  }

  displaySetPriceProductHandler = () =>{
    // display price, inventory, and buy button
    const contract = this.state.contract
    const account = this.state.account
    const productId = this.state.productId
    const storeName = this.state.storeName
    const web3 = this.state.web3
    let price = this.state.web3.fromWei(this.state.price, "ether");


    return(
      <div className="setPriceRender">
        <h2> {"Product number: " + productId} </h2>
        <p> {"Price: " + price} </p>
        <p> { this.state.inventory > 0 ?
          "Current Inventory " + this.state.inventory
          : "This product is out of stock :( "}
        </p>
        { this.state.inventory > 0 ?
          <button onClick={ () => {
            contract.buyItem(productId, storeName, {from: account, value:this.state.price})
            .then(() => alert("You bought product " +productId + " sucessfully!"))
            .catch(() => alert("Couldn't buy product. Please ensure there is enough gas with the transaction."))
          }}>
            {"Buy Product Number: " + productId}
          </button>
          : <h3> {"Please Check back later!"} </h3>
        }
      </div>
    )
  }



  displayAuctionProductHandler = () => {
    // display current price, reserve price, duration and buy button
    const contract = this.state.contract
    const account = this.state.account
    const auctionId = this.state.auctionId
    const duration = this.state.duration
    const productId = this.state.productId
    let price = this.state.web3.fromWei(this.state.price, "ether")
    let reserve = this.state.web3.fromWei(this.state.reservePrice, "ether")

    return(
      <div className="AuctionRender">
        { this.checkStillOnAuction() !=0 ?
          <div>
            <h2> {"Auction for Product: " + this.state.productId} </h2>
            <p> {"Current Price: " + this.state.price} </p>
            <p> {"Auction Reserve Price: " + this.state.reservePrice} </p>
            <p> {"Total duration of auction: " + duration} </p>
            <button onClick={() => {
              contract._bid(auctionId, productId, {from: account, value:this.state.price})
              .then(() => alert("You bought product " +productId + " sucessfully!"))
              .catch(() => alert("Couldn't buy product. Please ensure there is enough gas with the transaction."))
            }}>
              {"Buy Product Number: " + productId}
            </button>
          </div>
          : <h2> This Auction has Completed </h2>
        }
      </div>
    )
  }

  checkStillOnAuction = () =>{
    const contract =  this.state.contract
    const account =  this.state.account
    let reserve
    if(this.state.reservePrice !== null){
       reserve =  this.state.reservePrice.toNumber()
    }else{
       reserve = 0
    }
    let price
    if(this.state.price !== null){
       price = this.state.price.toNumber()
    }else(
       price = 0
    )
    const productId =  this.state.productId
    let res = false
    let bid;
    let time;

    price == reserve ? time = true : false

    //await time || bid ? res = true : res = false

    return(price)

  }

  render () {
    // constantly checking for changing metamask account
    if(this.state && this.state.account && this.state.web3){
      var accountInterval = setInterval(() => {
        if (this.state.web3.eth.accounts[0] !== this.state.account) {
          this.setState({account: this.state.web3.eth.accounts[0]})
        }
      }, 100);
    }

    return(
      <div className="productInstance">
        <div className="productWrapper">
          <h3> Product {this.state.productId} </h3>
          {this.state.itemsBought !== null && this.state.auctionId !== null ?
            <div className="products-display">
              {this.state.auctionId == 0  ?
              <div>{this.displaySetPriceProductHandler()}  </div>
              :
              <div> {this.displayAuctionProductHandler()} </div>
              }
            </div>
            : <div> ... loading ... </div>
          }
          {this.state.itemsBought !== null && this.state.storeOwner !== null ?
            <div className="adminOwnerDisplay">
              {this.state.itemsBought.length < 1  ?
              <p> there are no product items to be shipped at this time </p>
              :
              <div> {this.checkAdminOwnerProductHandler()} </div>
              }
            </div>
            : <div> ... loading ... </div>
          }
        </div>
      </div>
    )
  }

}
export default Product;
