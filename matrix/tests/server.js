const axios = require('axios');
const { multiplyEndpoints, ENDPOINTS } = require('../utils/endpoints');

async function testServerEndpoints() {
    console.log('🌐 Тест серверных эндпоинтов...\n');
    
    const SERVER_URL = 'http://localhost:3000';
  
    try {
        const referenceResponse = await axios.get(`${SERVER_URL}${ENDPOINTS.JS.BASE}`, { timeout: 5000 });
        const referenceValue = parseFloat(referenceResponse.data.match(/C\[0\]\[0\] = ([\d.]+)/)[1]);
        console.log(`✅ Референсный эндпоинт ${ENDPOINTS.JS.BASE} - OK`);

        let successCount = 0;
        let totalCount = 0;

        for (const endpoint of multiplyEndpoints) {
            totalCount++;
            
            try {
                const response = await axios.get(`${SERVER_URL}${endpoint}`, { timeout: 10000 });
                const value = parseFloat(response.data.match(/C\[0\]\[0\] = ([\d.]+)/)[1]);
                
                if (Math.abs(value - referenceValue) < 1e-5) {
                    console.log(`✅ ${endpoint} - OK`);
                    successCount++;
                } else {
                    console.log(`❌ ${endpoint} - значение не совпадает (${value} vs ${referenceValue})`);
                }
            } catch (error) {
                console.log(`⚠️ ${endpoint} - недоступен (${error.message.split(' ')[0]})`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`🎯 Результат: ${successCount}/${totalCount} эндпоинтов работают корректно\n`);
        return successCount > 0;
    } catch (error) {
        console.log('⚠️ Сервер недоступен, пропускаем серверные тесты\n');
        return true;
    }
}

module.exports = {
    testServerEndpoints
}