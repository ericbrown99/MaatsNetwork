import React, { Component } from 'react'

class Product extends Component {
  constructor (props){
    super(props)

    this.state = {
      productId: this.props.productId,
      storeName: this.props.storeName,
      web3: this.props.web3,
      contract: this.props.contract,
      account: this.props.account,
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
        let tempPrice = await contract.getCurrentSetPrice(storeName,productId,{from:account})
        return(await this.setState({
          price:tempPrice,
          inventory: tempInventory,
        }))
      }else{
        let tempPrice = await contract.getCurrentPrice(result,{from:account});
        let tempDuration = await contract.getDuration(result,{from:account});
        let tempReservePrice = await contract.getReservePrice(result,{from:account});
        return(await this.setState({
          price:tempPrice,
          duration: tempDuration,
          reservePrice: tempReservePrice,
          inventory: 1,
        }))
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
    .catch(() => console.log("error setting up product"))
  }

}
export default Product;
