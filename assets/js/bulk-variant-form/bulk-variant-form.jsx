import React, { Component } from 'react';
import './styles.css';
import BulkVariantRows from './bulk-variant-rows';
export default class BulkVariantForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            variants: [],
            lineItems: [],
            loaded: false,
            message: ''
        }

        this.renderAfterLoad = () => {
            if (this.state.loaded) {
                return (
                    <div>
                        <div className='bulk-variant-row'>
                            <div className='bulk-variant-col'><h5>Images</h5></div>
                            <div className='bulk-variant-col'><h5>Values</h5></div>
                            <div className='bulk-variant-col'><h5>Price</h5></div>
                            <div className='bulk-variant-col'><h5>SKU</h5></div>
                            <div className='bulk-variant-col'><h5>Quantity</h5></div>
                        </div>
                        <BulkVariantRows variants={this.state.variants} changeQty={this.changeQty}/>
                        <div className='bulk-button-row'>
                            <div className='bulk-variant-col' id='bulk-messaging'>{this.state.message}</div>
                            <button className='bulk-variant-col button button--primary' id='bulkAddToCart' onClick={this.addToCart}>Add to Cart</button>
                        </div>
                    </div>
                )
            } else {
                return (<p>OOF</p>)
            }
        }

        this.changeQty = (variantID, qty) => {
            this.setState({message: ''});
            const lineItems = [...this.state.lineItems];
            lineItems.forEach(item => {
                if (item.variantId == variantID) {
                    item.quantity = parseInt(qty);
                }
            })
            this.setState({
                lineItems: lineItems
            })
        }

        this.addToCart = (e) => {
            const lineItems = this.state.lineItems.map(item => {
                if (item.quantity > 0) {
                    return item;
                }
            }).filter(item => {
                if (item !== undefined) {
                    return item;
                }
            });
            if (lineItems.length < 1) {
                this.setState({message: 'Please set the quantity of at least 1 item.'})
            } else {
                e.target.disabled = true;
                this.setState({message: 'Adding items to your cart...'})
                fetch(`/api/storefront/cart`)
                .then(response => response.json())
                .then(cart => {
                    if(cart.length > 0) {
                        return addToExistingCart(cart[0].id)
                    } else {
                        return createNewCart()
                    }
                })
                .then(() => window.location = '/cart.php')
                .catch(err => console.log(err))
            }
            async function createNewCart() {
                const response = await fetch(`/api/storefront/carts`, {
                    credentials: "include",
                    method: "POST",
                    body: JSON.stringify({ lineItems: lineItems })
                });
                const data = await response.json();
                if (!response.ok) {
                    return Promise.reject("There was an issue adding items to your cart. Please try again.")
                } else {
                    console.log(data);
                }
            }
            async function addToExistingCart(cart_id) {
                const response = await fetch(`/api/storefront/carts/${cart_id}/items`, {
                    credentials: "include",
                    method: "POST",
                    body: JSON.stringify({ lineItems: lineItems })
                });
                const data = await response.json();
                if (!response.ok) {
                    return Promise.reject("There was an issue adding items to your cart. Please try again.")
                } else {
                    console.log(data);
                }
            }
        }
    }

    render() {
        return (
            <div className='bulk-form-field'>
                {this.renderAfterLoad()}
            </div>
        )
    }

    componentDidMount() {
        fetch('https://ti60c0fx22.execute-api.us-east-2.amazonaws.com/default/get_bigcommerce_product_variants?product_id=' + this.props.productID)
        .then(response => response.json())
        .then(formatted => {
            const lineItems = formatted['data'].map(variant => {
                return {variantId: variant.id, quantity: 0, productId: parseInt(this.props.productID)}
            });
            this.setState({
                variants: formatted['data'],
                lineItems: lineItems,
                loaded: true
            })
        })
        .catch(err => console.log('Bulk form could not load: ', err))
    }
}
