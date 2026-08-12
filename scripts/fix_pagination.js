const fs = require('fs');
let c = fs.readFileSync('src/components/ReportsModule.tsx', 'utf8');

c = c.replace(
  '                  ))}\r\n                </tbody>\r\n              </table>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      )}\r\n\r\n      {/* ---------------------------------------------------- */',
  '                  ))}\r\n                </tbody>\r\n              </table>\r\n            </div>\r\n            <div className="flex justify-between items-center mt-4 p-2 text-xs font-medium text-slate-500">\r\n              <span>Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, issuedTickets.length)} trong tổng số {issuedTickets.length}</span>\r\n              <div className="flex gap-1">\r\n                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Trước</button>\r\n                <button onClick={() => setPage(p => Math.min(Math.ceil(issuedTickets.length / pageSize), p + 1))} disabled={page === Math.ceil(issuedTickets.length / pageSize) || issuedTickets.length === 0} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Sau</button>\r\n              </div>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      )}\r\n\r\n      {/* ---------------------------------------------------- */'
);

c = c.replace(
  '                  ))}\n                </tbody>\n              </table>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* ---------------------------------------------------- */',
  '                  ))}\n                </tbody>\n              </table>\n            </div>\n            <div className="flex justify-between items-center mt-4 p-2 text-xs font-medium text-slate-500">\n              <span>Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, issuedTickets.length)} trong tổng số {issuedTickets.length}</span>\n              <div className="flex gap-1">\n                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Trước</button>\n                <button onClick={() => setPage(p => Math.min(Math.ceil(issuedTickets.length / pageSize), p + 1))} disabled={page === Math.ceil(issuedTickets.length / pageSize) || issuedTickets.length === 0} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Sau</button>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* ---------------------------------------------------- */'
);

fs.writeFileSync('src/components/ReportsModule.tsx', c);
console.log('Done replacing!');
