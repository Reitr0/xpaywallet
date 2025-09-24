import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

const Fetchbtc = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
    const parameters = {
        'symbol': 'BTC',
        'convert': 'USD'
    };
    const headers = {
        'Accepts': 'application/json',
        'X-CMC_PRO_API_KEY': 'e9beb9b2-25e8-4d70-98c6-a1157d823659',
    };

    useEffect(() => {
        const fetchbtcAsync = async () => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers,
                    params: parameters,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const jsonData = await response.json();
                setData(jsonData);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchbtcAsync();
    }, []);

    if (isLoading) {
        return <View><Text>Loading...</Text></View>;
    }

    if (error) {
        return <View><Text>Error: {error.message}</Text></View>;
    }

    const btcPrice = data.data.BTC.quote.USD.price;

    return (
        <View>
            <Text>BTC Prices: {btcPrice}</Text>
        </View>
    );
};

export default Fetchbtc;
