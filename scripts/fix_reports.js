const fs = require('fs');
let c = fs.readFileSync('src/components/ReportsModule.tsx', 'utf8');

c = c.replace(
  'const [searchTrigger, setSearchTrigger] = useState(0);',
  'const [searchTrigger, setSearchTrigger] = useState(0);\n  const [isDataLoaded, setIsDataLoaded] = useState(false);'
);

c = c.replace(
  'if (productsRes.status === \'fulfilled\') setLiveProducts(extractList(productsRes.value));\n      } catch (err)',
  'if (productsRes.status === \'fulfilled\') setLiveProducts(extractList(productsRes.value));\n        setIsDataLoaded(true);\n      } catch (err)'
);

c = c.replace(
  'const orders = liveOrders.length > 0 ? liveOrders : dbStore.orders;',
  'const orders = isDataLoaded ? liveOrders : dbStore.orders;'
);

c = c.replace(
  'const issuedTickets = liveTickets.length > 0 ? liveTickets : dbStore.issuedTickets;',
  'const issuedTickets = isDataLoaded ? liveTickets : dbStore.issuedTickets;'
);

c = c.replace(
  'const gateLogs = liveGateLogs.length > 0 ? liveGateLogs : dbStore.gateAccessLogs;',
  'const gateLogs = isDataLoaded ? liveGateLogs : dbStore.gateAccessLogs;'
);

c = c.replace(
  'const systemLogs = liveSystemLogs.length > 0 ? liveSystemLogs : dbStore.systemLogs;',
  'const systemLogs = isDataLoaded ? liveSystemLogs : dbStore.systemLogs;'
);

fs.writeFileSync('src/components/ReportsModule.tsx', c);
console.log('Fixed fallback logic!');
