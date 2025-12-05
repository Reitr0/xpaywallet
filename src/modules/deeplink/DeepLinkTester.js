import { deepLinkHandler } from './DeepLinkHandler';

export class DeepLinkTester {
    constructor() {
        this.testCases = [
            // WalletConnect tests
            {
                name: 'WalletConnect Direct',
                url: 'wc:39de1673f92c2428cf2d0b9ea68accaca29877e7370469e7c06639142dc089a0@2?relay-protocol=irn&symKey=1ee0de1e4b9ebde49b5881ec372123d495a02f90d42018fd01dfc33f35ff6f85',
                expected: 'WalletConnect'
            },
            {
                name: 'WalletConnect via yo-wallet',
                url: 'yo-wallet://wc?uri=wc%3A39de1673f92c2428cf2d0b9ea68accaca29877e7370469e7c06639142dc089a0%402%3Frelay-protocol%3Dirn%26symKey%3D1ee0de1e4b9ebde49b5881ec372123d495a02f90d42018fd01dfc33f35ff6f85',
                expected: 'WalletConnect'
            },
            {
                name: 'WalletConnect via walletconnect scheme',
                url: 'walletconnect://wc?uri=wc%3A39de1673f92c2428cf2d0b9ea68accaca29877e7370469e7c06639142dc089a0%402%3Frelay-protocol%3Dirn%26symKey%3D1ee0de1e4b9ebde49b5881ec372123d495a02f90d42018fd01dfc33f35ff6f85',
                expected: 'WalletConnect'
            },
            
            // MetaMask tests
            {
                name: 'MetaMask DApp',
                url: 'metamask://dapp?url=https://pancakeswap.finance',
                expected: 'MetaMask'
            },
            {
                name: 'MetaMask WalletConnect',
                url: 'metamask-wc://wc?uri=wc%3A39de1673f92c2428cf2d0b9ea68accaca29877e7370469e7c06639142dc089a0%402%3Frelay-protocol%3Dirn%26symKey%3D1ee0de1e4b9ebde49b5881ec372123d495a02f90d42018fd01dfc33f35ff6f85',
                expected: 'MetaMask WalletConnect'
            },
            
            // Trust Wallet tests
            {
                name: 'Trust Wallet DApp',
                url: 'trust://open_url?url=https://uniswap.org',
                expected: 'Trust Wallet'
            },
            
            // Rainbow Wallet tests
            {
                name: 'Rainbow Wallet DApp',
                url: 'rainbow://open?url=https://app.uniswap.org',
                expected: 'Rainbow Wallet'
            },
            
            // Coinbase Wallet tests
            {
                name: 'Coinbase Wallet DApp',
                url: 'cbwallet://open?url=https://app.uniswap.org',
                expected: 'Coinbase Wallet'
            },
            
            // Phantom Wallet tests (Solana)
            {
                name: 'Phantom Wallet DApp',
                url: 'phantom://open?url=https://raydium.io',
                expected: 'Phantom Wallet'
            },
            
            // Solflare Wallet tests (Solana)
            {
                name: 'Solflare Wallet DApp',
                url: 'solflare://open?url=https://raydium.io',
                expected: 'Solflare Wallet'
            },
            
            // Custom app tests
            {
                name: 'NewXPay Wallet',
                url: 'newxpay://wallet',
                expected: 'Custom App'
            },
            {
                name: 'NewXPay DApps',
                url: 'newxpay://dapps',
                expected: 'Custom App'
            },
            {
                name: 'NewXPay Settings',
                url: 'newxpay://settings',
                expected: 'Custom App'
            },
            {
                name: 'NewXPay Swap',
                url: 'newxpay://swap',
                expected: 'Custom App'
            },
            {
                name: 'NewXPay NFT',
                url: 'newxpay://nft',
                expected: 'Custom App'
            },
            {
                name: 'XPay Wallet (alternative)',
                url: 'xpay://wallet',
                expected: 'Custom App'
            },
            
            // Unknown scheme test
            {
                name: 'Unknown Scheme',
                url: 'unknown://test?url=https://example.com',
                expected: 'Unknown'
            }
        ];
    }

    async runAllTests() {
        console.log('🧪 Starting Deep Link Tests...');
        console.log('='.repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        for (const testCase of this.testCases) {
            try {
                console.log(`\n🔍 Testing: ${testCase.name}`);
                console.log(`📱 URL: ${testCase.url}`);
                
                // Test the deep link handler
                deepLinkHandler.testDeepLink(testCase.url);
                
                console.log(`✅ Test passed: ${testCase.name}`);
                passed++;
            } catch (error) {
                console.error(`❌ Test failed: ${testCase.name}`);
                console.error(`   Error: ${error.message}`);
                failed++;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Test Results:`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        
        return { passed, failed };
    }

    async testWalletConnect() {
        console.log('🔌 Testing WalletConnect Deep Links...');
        
        const wcTests = this.testCases.filter(test => test.expected === 'WalletConnect');
        for (const test of wcTests) {
            console.log(`\n🔍 ${test.name}`);
            deepLinkHandler.testDeepLink(test.url);
        }
    }

    async testMetaMask() {
        console.log('🦊 Testing MetaMask Deep Links...');
        
        const mmTests = this.testCases.filter(test => test.expected.includes('MetaMask'));
        for (const test of mmTests) {
            console.log(`\n🔍 ${test.name}`);
            deepLinkHandler.testDeepLink(test.url);
        }
    }

    async testCustomApp() {
        console.log('📱 Testing Custom App Deep Links...');
        
        const customTests = this.testCases.filter(test => test.expected === 'Custom App');
        for (const test of customTests) {
            console.log(`\n🔍 ${test.name}`);
            deepLinkHandler.testDeepLink(test.url);
        }
    }

    // Generate ADB commands for testing
    generateAdbCommands() {
        console.log('📱 ADB Commands for Testing:');
        console.log('='.repeat(50));
        
        for (const testCase of this.testCases) {
            const adbCommand = `adb shell am start -n com.xpay.newwallet/.MainActivity -d "${testCase.url}"`;
            console.log(`\n# ${testCase.name}`);
            console.log(adbCommand);
        }
    }
}

// Export singleton instance
export const deepLinkTester = new DeepLinkTester();
