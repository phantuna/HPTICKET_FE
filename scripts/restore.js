const fs = require('fs');
let c = fs.readFileSync('src/components/ReportsModule.tsx', 'utf8');

const missingBlock = `
        if (usersRes.status === 'fulfilled') setUsers(extractList(usersRes.value));
        if (countersRes.status === 'fulfilled') setSalesCounters(extractList(countersRes.value));
        if (groupsRes.status === 'fulfilled') setCustomerGroups(extractList(groupsRes.value));
        if (sourcesRes.status === 'fulfilled') setCustomerSources(extractList(sourcesRes.value));
        if (templatesRes.status === 'fulfilled') setTicketTemplates(extractList(templatesRes.value).filter((t: any) => t.is_active || t.isActive || t.active || t.status !== 'INACTIVE'));
        if (logsRes.status === 'fulfilled') setLiveSystemLogs(extractList(logsRes.value));
        if (gateLogsRes.status === 'fulfilled') setLiveGateLogs(extractList(gateLogsRes.value));
        if (productsRes.status === 'fulfilled') setLiveProducts(extractList(productsRes.value));
        setIsDataLoaded(true);
      } catch (err) {
        console.error('Failed to fetch data for dashboard:', err);
      }
    };
    loadData();
  }, [searchTrigger]);

  const orders = isDataLoaded ? liveOrders : dbStore.orders;
  const issuedTickets = isDataLoaded ? liveTickets : dbStore.issuedTickets;

  // Compute Revenue Stats
  const totalRevenue = orders.reduce((acc, o) => acc + (o.final_amount || 0), 0);
  const totalTicketsSold = orders.reduce((acc, o) => acc + ((o as any).items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0), 0);

  const adultTickets = issuedTickets.filter(t => !(t as any).ticket_name?.toLowerCase().includes('trẻ em')).length;
  const childTickets = issuedTickets.filter(t => (t as any).ticket_name?.toLowerCase().includes('trẻ em')).length;

  const chartDataMap: Record<string, number> = {};
  orders.forEach(o => {
    const dateStr = o.created_at ? o.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
    const [year, monthStr, dayStr] = dateStr.split('-');
    const m = parseInt(monthStr, 10);

    let key = '';
    if (chartView === 'day') {
      key = \`\${dateStr}|\${dayStr}/\${monthStr}\`;
    } else if (chartView === 'week') {
      const d = new Date(dateStr);
      const start = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((d.getDay() + 1 + days) / 7);
      key = \`\${year}-W\${weekNumber.toString().padStart(2, '0')}|Tuần \${weekNumber}\`;
    } else if (chartView === 'month') {
      key = \`\${year}-\${monthStr}|Tháng \${m}\`;
    } else if (chartView === 'quarter') {
      const q = Math.ceil(m / 3);
      key = \`\${year}-Q\${q}|Quý \${q}\`;
    }

    chartDataMap[key] = (chartDataMap[key] || 0) + (o.final_amount || 0);
  });

  const chartData = Object.keys(chartDataMap).sort((a, b) => a.localeCompare(b)).map(key => {
    const [sortKey, label] = key.split('|');
    return {
      name: label,
      DoanhThu: chartDataMap[key]
    };
  });


  const gateLogs = isDataLoaded ? liveGateLogs : dbStore.gateAccessLogs;
  const systemLogs = isDataLoaded ? liveSystemLogs : dbStore.systemLogs;

  const totalCash = orders.filter((o) => o.payment_method === PaymentMethod.CASH).reduce((acc, o) => acc + (o.final_amount || 0), 0);
  const totalBankTransfer = orders.filter((o) => o.payment_method !== PaymentMethod.CASH).reduce((acc, o) => acc + (o.final_amount || 0), 0);
  const totalTicketsIssued = issuedTickets.length;

`;

c = c.replace(
  '  const subTabs = [',
  missingBlock + '  const subTabs = ['
);

fs.writeFileSync('src/components/ReportsModule.tsx', c);
