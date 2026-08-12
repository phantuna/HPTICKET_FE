const fs = require('fs');
const lines = fs.readFileSync('src/components/ReportsModule.tsx', 'utf8').split(/\r?\n/);

const newLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  
  if (lines[i].includes('              </table>') && lines[i+1] && lines[i+1].includes('            </div>') && lines[i+2] && lines[i+2].includes('          </div>') && lines[i+3] && lines[i+3].includes('        </div>')) {
    if (!found) {
       newLines.push(lines[i+1]);
       newLines.push('            <div className="flex justify-between items-center mt-4 p-2 text-xs font-medium text-slate-500">');
       newLines.push('              <span>Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, issuedTickets.length)} trong tổng số {issuedTickets.length}</span>');
       newLines.push('              <div className="flex gap-1">');
       newLines.push('                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Trước</button>');
       newLines.push('                <button onClick={() => setPage(p => Math.min(Math.ceil(issuedTickets.length / pageSize), p + 1))} disabled={page === Math.ceil(issuedTickets.length / pageSize) || issuedTickets.length === 0} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Sau</button>');
       newLines.push('              </div>');
       newLines.push('            </div>');
       
       i += 1;
       found = true;
    }
  }
}

fs.writeFileSync('src/components/ReportsModule.tsx', newLines.join('\n'));
console.log('Success? ' + found);
