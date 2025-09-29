const { testJsAddons } = require('./js-native');
const { testServerEndpoints } = require('./server');
const { testCppAddons } = require('./cpp-addon');
const { testRustAddons } = require('./rust-addon');
const { testWasmAddons } = require('./wasm');

async function runAllTests() {
  console.log('🧪 Запуск всех тестов...\n');
  
  const results = {
    js: await testJsAddons(),
    rust: await testRustAddons(),
    cpp: await testCppAddons(), 
    wasm: await testWasmAddons(),
    server: await testServerEndpoints()
  };

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log('📊 Итоговые результаты:');
  console.log(`✅ Пройдено: ${passedTests}/${totalTests} наборов тестов`);
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${name}`);
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 Все тесты пройдены успешно!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Некоторые тесты провалены или пропущены');
    process.exit(0);
  }
}

runAllTests().catch(console.error);