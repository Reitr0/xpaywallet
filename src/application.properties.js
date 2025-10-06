export const applicationProperties = {
    isTesting: false,
    defaultTheme: {
        code: 'light',
        icon: 'Light',
        name: 'Light',
    },
    themes: [
        {
            code: 'dark',
            icon: 'Dark',
            name: 'Dark',
        },
        {
            code: 'light',
            icon: 'Light',
            name: 'Light',
        },
    ],
    defaultCurrency: {code: 'USD', value: 1, name: 'US Dollar', symbol: '$'},
    currencies: [
        {
            code: 'AUD',
            name: 'Australian Dollar',
            symbol: '$',
        },
        {
            code: 'EUR',
            name: 'Euro',
            symbol: '€',
        },
        {
            code: 'GBP',
            name: 'British Pound',
            symbol: '£',
        },
        {
            code: 'RUB',
            name: 'Russian Ruble',
            symbol: '₽',
        },
        {
            code: 'USD',
            name: 'US Dollar',
            symbol: '$',
        },
    ],
    defaultWalletName: 'XPAY Wallet',
    logoURI: {
        app: 'https://i.ibb.co/ZdkdCsT/1024.png',
        eth: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        bsc: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png',
        polygon:
            'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
        tron: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png',
        noImage: 'https://epay-images.s3.us-east-2.amazonaws.com/no-photo.png',
        trc20: 'https://tokens.pancakeswap.finance/images/0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B.png',
        solana: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
        xusdt: 'https://static.tronscan.org/production/upload/logo/new/TAZ1dbBfBCELD49obL3Agh9GtYVrp3jkJL.png?t=1715415057068',
    },
    endpoints: {
        app: {
            url: 'https://dukuwallet-2aeb92c5caa8.herokuapp.com/', //to this url <<<
            wssUrl: 'https://dukuwallet-2aeb92c5caa8.herokuapp.com/wss/v1/hello-wss',
        },
        privacyPolicy: 'https://metaxbank.io/home/',
        termsOfService: 'https://metaxbank.io/home/',
        ramp: 'https://app.ramp.network/?hostApiKey=ycrtmt9ec9xmgn3cgqvgbt9sw6jyptmxyfnm7f3x&hostAppName=VCoinLab&hostLogoUrl=https://gcdnb.pbrd.co/images/TkytqqjxUNgG.png?o=1',
        helpCenter: 'https://metaxpay.io/download/android',
        twitter: '',
        telegram: '',
        facebook: '',
        reddit: '',
        youtube: '',
        about: '',
        discord: '',
    },
    dapps: [
        {
            id: 'metaxbank',
            name: 'DefiXBANK',
            desc: 'Send Money Overseas Fast,Seamless and Low Cost',
            logo: 'https://i.ibb.co/7WkxZZ2/Untitled-3.png',
            url: '',
        },
        {
            id: 'metaxbook',
            name: 'Meta X project',
            desc: 'Dapp For Meta X Project',
            logo: 'https://i.ibb.co/7WkxZZ2/Untitled-3.png',
            url: 'https://member.metaxproject.io/',
        },
        {
            id: 'metaxfuture',
            name: 'SolXChange',
            desc: 'Solana XChanger',
            logo: 'https://i.ibb.co/qzGBpST/logo.png',
            url: 'https://solxchange.io/signin?redirect=/',
        },
        {
            id: 'aave',
            name: 'Meta X Future',
            desc: 'Meta X Future',
            logo: 'https://i.ibb.co/7WkxZZ2/Untitled-3.png',
            url: 'https://iframe.dacast.com/live/c7f2a8b1-d364-37fb-2fa2-cea24a3aff2b/d30253d3-e6d1-7aad-b9e3-9283186bd2dc',
        },
        {
            id: 'soldapp',
            name: 'Soldapp',
            desc: 'Dapp For Meta X Project',
            logo: 'https://i.ibb.co/7WkxZZ2/Untitled-3.png',
            url: 'https://solxdapp.io/signup',
        },
        // {
        //     id: 'uniswap',
        //     name: 'Uniswap Exchange',
        //     desc: 'Uniswap is a protocal for automated token exchange',
        //     logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
        //     url: 'https://app.uniswap.org/#/swap',
        // },
        // {
        //     id: '1inch.io',
        //     name: '1inch.io',
        //     desc: 'Token Swap Aggregator',
        //     logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8104.png',
        //     url: 'https://app.1inch.io/#/1/unified/swap/ETH/DAI',
        // },
        // {
        //     id: 'pancakeswap.finance',
        //     name: 'Exchange | PancakeSwap',
        //     desc: 'The most popular AMM on BSC by user count! Earn CAKE through yield farming or win it in the Lottery, then stake it in Syrup Pools to earn more tokens! Initial Farm Offerings (new token launch model pioneered by PancakeSwap), NFTs, and more, on a platform you can trust.',
        //     logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png',
        //     url: 'https://pancakeswap.finance/swap',
        // },
    ],
    walletConnect: {
        description: 'VCoinLab Wallet',
        url: 'https://www.vcoinlab.com/blog/privacy-policy',
        icons: ['https://www.vcoinlab.com/static/images/logo.png'],
        name: 'VCoinLab Wallet',
        ssl: true,
    },
    oneSignal: {
        appId: '63da9a2a-4ea6-4c98-8cf6-ecef0a6e851d',
    },
    networks: [
        {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            chain: 'ETH',
            logoURI:
                'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        },
        {
            id: 'binance-chain',
            name: 'Binance Smart Chain',
            chain: 'BSC',
            symbol: 'BNB',
            logoURI:
                'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png',
        },
        {
            id: 'polygon',
            name: 'Polygon',
            chain: 'POLYGON',
            symbol: 'MATIC',
            logoURI:
                'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
        },
        {
            id: 'tron',
            name: 'Tron',
            chain: 'TRON',
            symbol: 'TRX',
            logoURI:
                'https://s2.coinmarketcap.com/static/img/coins/200x200/1958.png',
        },
        {
            id: 'solana',
            name: 'Solana',
            chain: 'SOLANA',
            symbol: 'SOL',
            logoURI:
                'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png',
        },
    ],
};
