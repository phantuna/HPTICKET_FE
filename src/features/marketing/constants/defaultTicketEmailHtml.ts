export const DEFAULT_TICKET_EMAIL_HTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header-info {
      margin-bottom: 20px;
    }
    .header-info div {
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .box {
      border: 1px solid #333;
      padding: 15px;
      margin-bottom: 0px;
    }
    .box p {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: center;
    }
    th {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      padding: 8px;
      border: 1px solid #333;
      border-bottom: none;
      background-color: #f9f9f9;
    }
    .total-row td {
      font-weight: bold;
      text-align: center;
    }
    .notes {
      margin-top: 30px;
    }
    .notes-title {
      font-weight: bold;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .notes ul {
      margin-top: 10px;
      padding-left: 20px;
    }
    .notes li {
      margin-bottom: 5px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-info">
      <div>
        <div class="label">Email</div>
        <div>{{emailTo}}</div>
      </div>
      <div>
        <div class="label">Tiêu đề</div>
        <div>Sự kiện: {{eventName}}</div>
      </div>
      <div class="label">Nội dung</div>
    </div>

    <div class="box">
      <p>Họ và tên: {{customerName}}</p>
      <p>Số điện thoại: {{customerPhone}}</p>
      <p>Email: {{customerEmail}}</p>
    </div>

    <div class="section-title">THÔNG TIN SỰ KIỆN</div>
    <table>
      <thead>
        <tr>
          <th>Sự kiện</th>
          <th>Thời gian bắt đầu</th>
          <th>Địa điểm</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{eventName}}</td>
          <td>{{startTime}}</td>
          <td>{{location}}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title" style="margin-top: 20px;">THÔNG TIN VÉ</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Số ghế</th>
          <th>Giá vé (VND)</th>
          <th>Mã vé</th>
          <th>Mã Checkin</th>
        </tr>
      </thead>
      <tbody>
        {{#each tickets}}
        <tr>
          <td>{{this.index}}</td>
          <td>{{this.seatInfo}}</td>
          <td>{{this.price}}</td>
          <td>{{this.ticketCode}}</td>
          <td><img src="{{this.qrCodeBase64}}" alt="QR Code" width="100" height="100" /></td>
        </tr>
        {{/each}}
        <tr class="total-row">
          <td colspan="2">Tổng tiền thanh toán</td>
          <td colspan="3">{{totalPayment}} VND</td>
        </tr>
      </tbody>
    </table>

    <div class="notes">
      <div class="notes-title">❖ LƯU Ý</div>
      <ul>
        <li>Quý khách vui lòng có mặt trước giờ biểu diễn/sự kiện 15 phút để làm thủ tục và ổn định chỗ ngồi.</li>
        <li>Nhà hát sẽ đóng cửa ra vào sau khi chương trình biểu diễn bắt đầu 15 phút. Quý khách tới trễ sẽ được sắp xếp chỗ ngồi tại khu vực phù hợp để tránh ảnh hưởng tới khán giả và nghệ sĩ. Do các yếu tố kỹ thuật và an toàn của Nhà hát, chúng tôi xin lỗi không thể đưa...</li>
      </ul>
    </div>
  </div>
</body>
</html>
`;
