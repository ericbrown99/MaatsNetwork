import React, { Component } from 'react'

class Store extends Component {
  constructor (props) {
    super(props)

    this.state = {
      storeName: this.props.storeName,
      storeOwner: null,
      storeAdmins: [],
      products: [],
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

    contract.StoreNameToOwner(this.State.storeName)
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


    // Get store owner address
    // Get products if there are any
    // get admins
    // get storeName
  }
  render(){
    if(this.state && this.state.account && this.state.web3){
      var accountInterval = setInterval(() => {
        if (this.state.web3.eth.accounts[0] !== this.state.account) {
          this.setState({account: this.state.web3.eth.accounts[0]})
        }
      }, 100);
    }

    return(
      <div>
        <h4> Welcome to {this.props.storeName} </h4>
      </div>
    )
  }

}
export default Store;
