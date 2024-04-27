import axios from 'axios';
import qs from 'qs';

// payment info
const apiKey = 'ZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKSVV6VXhNaUo5LmV5SndjbTltYVd4bFgzQnJJam94TlRrME9EUXNJbU5zWVhOeklqb2lUV1Z5WTJoaGJuUWlMQ0p1WVcxbElqb2lhVzVwZEdsaGJDSjkuUFdpQTBBREs2Q3ZfbEVhNXN1TEJfdmdmbUNQa2RnVDlYczJuRnJabWJhR0dET3NsMkZSdlNKSG9Ec09TUHJySGJvbEVBMEpTMHZNUG4yYjZONXRfRVE='
const cardIntegrationId = '2765377'
const walletIntegrationId = '2765376'



const payoutClientId = 'mkVByrVQFTsfYwC4FyxLfSutxDvl8p7UU2kCgNqk'
const payoutClientSecret = 'jcTE3AM7ydbTSrf5vJgMEdkJ1HPL7H4H7Xl5RO1zAnAUWergXAx5rFwP5qTrQ1EhkhE8bqkcSpWV6gKJVVVxhxysEz7uQMGGVUi0IQKDRZoQHnZ0P75nE67u5ePQGPI3'
const payoutUsername = '49_api_checker'
const payoutPassword = 'pIB6dSKOAGrutR50XghWpIK#5'
const payoutGrantType = 'password'


/** ------------------------------------------------------  
 * @desc get payment token
 * @route /payment
 * @method get
 * @access private get payment token
 /**  ------------------------------------------------------  */
export async function getPaymobToken() {

    const result = await axios
        .post('https://accept.paymob.com/api/auth/tokens', {
            "api_key": apiKey
        })

    return result.data.token
}

/** ------------------------------------------------------  
 * @desc make order
 * @route /payment
 * @method post
 * @access private make order
 /**  ------------------------------------------------------  */
export async function makeOrder(token, amount) {

    const result = await axios
        .post('https://accept.paymob.com/api/ecommerce/orders', {
            "auth_token": token,
            "amount_cents": amount,
            "currency": "EGP",
        })
    return result.data.id // order id

}

/** ------------------------------------------------------  
 * @desc get payment token
 * @route /payment
 * @method get
 * @access private get payment token
 /**  ------------------------------------------------------  */
export async function makeWalletOrder(paymentToken , phoneNumber) {

    const result = await axios
        .post('https://accept.paymob.com/api/acceptance/payments/pay', {
            "source": {
                "identifier": phoneNumber,
                "subtype": "WALLET"
            },
            "payment_token": paymentToken
        })
    return result.data.redirect_url

}

/** ------------------------------------------------------  
 * @desc get payment keys
 * @route /payment
 * @method get
 * @access private get payment keys
 /**  ------------------------------------------------------  */
export async function paymentKeys(token, orderId, amount, billing_data, isCard) {


    const result = await axios
        .post('https://accept.paymob.com/api/acceptance/payment_keys', {
            "auth_token": token,
            "amount_cents": amount,
            "expiration": 3600,
            "order_id": orderId,
            "billing_data": billing_data,
            "currency": "EGP",
            "integration_id": isCard == true ? cardIntegrationId : walletIntegrationId,
            "lock_order_when_paid": "false"
        })
    return result.data.token
}

/** ------------------------------------------------------  
 * @desc get HMAC order
 * @route /payment
 * @method get
 * @access private get HMAC order
 /**  ------------------------------------------------------  */
export async function getHMACByOrderId(token, orderId) {
    const result = await axios
        .get(`https://accept.paymobsolutions.com/api/acceptance/transactions/${orderId}/hmac_calc`,
            {
                headers:
                {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
    return result.data.hmac
}

/** ------------------------------------------------------  
 * @desc get payout token
 * @route /payment
 * @method get
 * @access private get payout token
 /**  ------------------------------------------------------  */
export async function getPayoutToken() {

    const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: qs.stringify({
            'client_id': payoutClientId,
            'client_secret': payoutClientSecret,
            'username': payoutUsername,
            'password': payoutPassword,
            'grant_type': payoutGrantType
        }),
        url: `https://stagingpayouts.paymobsolutions.com/api/secure/o/token/`,
    };

    const result = await axios(options)

    return result.data.access_token
}


/** ------------------------------------------------------  
 * @desc get wallet
 * @route /payment
 * @method get
 * @access private get wallet
 /**  ------------------------------------------------------  */
export async function walletPayout(token, amount, issuer, msisdn) { // mobile wallet , bank wallet


    try {
        const options = {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                "amount": amount,
                "issuer": issuer,
                "msisdn": msisdn,
            },
            url: `https://stagingpayouts.paymobsolutions.com/api/secure/disburse/`,
        };

        const result = await axios(options)
        return result.data
    } catch (e) {
        throw e.response.data.status_description ?? 'Unkown Error'
    }
}

/** ------------------------------------------------------  
 * @desc aman payout
 * @route /payment
 * @method get
 * @access private aman payout
 /**  ------------------------------------------------------  */
export async function amanPayout(token, amount, msisdn, first_name, last_name, email) {

    try {

        const options = {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                "issuer": "aman",
                "amount": amount,
                "msisdn": msisdn,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
            },
            url: `https://stagingpayouts.paymobsolutions.com/api/secure/disburse/`,
        };

        const result = await axios(options)
        return result.data
    } catch (e) {
        throw e.response.data.status_description ?? 'Unkown Error'
    }
}

/** ------------------------------------------------------  
 * @desc bank Card Payout
 * @route /payment
 * @method get
 * @access private bank Card Payout
 /**  ------------------------------------------------------  */
export async function bankCardPayout(token, amount, full_name, bank_card_number, bank_code) {

    try {
        
        const options = {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                "issuer": "bank_card",
                "amount": amount,
                "full_name": full_name,
                "bank_card_number": bank_card_number,
                "bank_code": bank_code,
                "bank_transaction_type": "cash_transfer"
            },
            url: `https://stagingpayouts.paymobsolutions.com/api/secure/disburse/`,
        };

        const result = await axios(options)
        return result.data
    } catch (e) {
        throw e.response.data.status_description ?? 'Unkown Error'
    }
}