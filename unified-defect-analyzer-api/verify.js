const logs = db.logs.countDocuments();
const defects = db.historic_defects.countDocuments();
const tests = db.test_executions.countDocuments();

console.log('\n✅ VERIFICATION COMPLETE\n');
console.log('📊 Record Counts:');
console.log('  • Logs: ' + logs);
console.log('  • Historic Defects: ' + defects);
console.log('  • Test Executions: ' + tests);
console.log('\n✅ MongoDB is ready for API testing!\n');
