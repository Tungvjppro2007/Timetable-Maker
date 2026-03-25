const START_HOUR = 5;
const END_HOUR = 19;

const currentDate = new Date();
console.log(currentDate.toString());

// Biến toàn cục để lưu trạng thái xem đang Sửa sự kiện nào (null = Tạo mới)
let currentEditIndex = null;

var days = [
  { name: "Thứ 2" },
  { name: "Thứ 3" },
  { name: "Thứ 4" },
  { name: "Thứ 5" },
  { name: "Thứ 6" },
  { name: "Thứ 7" },
  { name: "Chủ nhật" },
]

days[new Date().getDay() - 1].active = true;

days.forEach((day, index) => {
  const dayDate = new Date();
  dayDate.setDate(currentDate.getDate() - currentDate.getDay() + 1 + index);
  day.date = dayDate.getDate() + "/" + (dayDate.getMonth() + 1);
});

const colorMap = {
  blue: { bg: "var(--color-blue)", border: "var(--color-blue-dark)" },
  purple: { bg: "var(--color-purple)", border: "var(--color-purple-dark)" },
  orange: { bg: "var(--color-orange)", border: "var(--color-orange-dark)" },
  green: { bg: "var(--color-green)", border: "var(--color-green-dark)" },
};

function initLayout() {
  const gridLines = document.getElementById("gridLines");
  const timeCol = document.querySelector(".time-col"); 
  
  let gridHTML = "";
  
  let timeHTML = `<div class="time-col-header"></div><div class="time-labels-area">`;

  const totalHours = END_HOUR - START_HOUR;

  for (let i = START_HOUR; i <= END_HOUR; i+=2) {
    
    const topPercent = ((i - START_HOUR) / totalHours) * 100;

    gridHTML += `<div class="grid-line" style="top: ${topPercent}%;"></div>`;

    const hourString = i.toString().padStart(2, '0') + ":00"; // Format thành 05:00
    timeHTML += `<div class="time-slot-label" style="top: ${topPercent}%;">${hourString}</div>`;
  }

  timeHTML += `</div>`; 

  if (gridLines) gridLines.innerHTML = gridHTML;
  if (timeCol) timeCol.innerHTML = timeHTML;

  const daysContainer = document.getElementById("daysContainer");
  days.forEach((day, index) => {
    daysContainer.innerHTML += `
      <div class="day-col" data-dayindex="${index}">
        <div class="day-header ${day.active ? "active" : ""}">
            <div>${day.name}</div>
            <div class="date">${day.date}</div>
        </div>
        <div class="events-area" id="events-area-${index}"></div>
      </div>
    `;
  });
}

function getEvents() {
  return JSON.parse(localStorage.getItem("my_timetable")) || [];
}
function saveEvents(events) {
  localStorage.setItem("my_timetable", JSON.stringify(events));
}

function renderEvents() {
  for (let i = 0; i < 7; i++) {
    document.getElementById(`events-area-${i}`).innerHTML = "";
  }

  const events = getEvents();
  
  // TÍNH TỔNG SỐ PHÚT CỦA CẢ BẢNG LỊCH TRÌNH (Từ START đến END)
  const totalTimetableMinutes = (END_HOUR - START_HOUR) * 60;

  events.forEach((ev, index) => {
    const area = document.getElementById(`events-area-${ev.dayIndex}`);
    if (!area) return;

    const startParts = ev.startTime.split(":");
    const endParts = ev.endTime.split(":");

    const startInMinutes = (parseInt(startParts[0]) - START_HOUR) * 60 + parseInt(startParts[1]);
    const endInMinutes = (parseInt(endParts[0]) - START_HOUR) * 60 + parseInt(endParts[1]);
    const durationInMinutes = endInMinutes - startInMinutes;

    // SỬA: Đổi từ tính Pixel sang tính Phần trăm (%)
    const topPercent = (startInMinutes / totalTimetableMinutes) * 100;
    const heightPercent = (durationInMinutes / totalTimetableMinutes) * 100;

    const colors = colorMap[ev.color];

    const eventEl = document.createElement("div");
    eventEl.className = "event";
    
    eventEl.style.top = `${topPercent}%`;
    eventEl.style.height = `${heightPercent}%`;
    
    eventEl.style.backgroundColor = colors.bg;
    eventEl.style.borderLeft = `4px solid ${colors.border}`;

    eventEl.innerHTML = `
      <div class="time">${ev.startTime} - ${ev.endTime}</div>
      <div class="title">${ev.title}</div>
    `;

    eventEl.onclick = function () {
      openModal(true, ev, index);
    };

    area.appendChild(eventEl);
  });
}

const modal = document.getElementById("eventModal");
const form = document.getElementById("eventForm");
const modalTitle = document.getElementById("modalTitle");
const btnDelete = document.getElementById("btnDelete");

function openModal(isEdit = false, eventData = null, index = null) {
  modal.style.display = "flex";

  if (isEdit) {
    // Chế độ CHỈNH SỬA
    currentEditIndex = index;
    modalTitle.innerText = "Chỉnh sửa sự kiện";
    btnDelete.style.display = "block"; // Hiện nút Xóa

    // Đổ dữ liệu cũ vào Form
    document.getElementById("evTitle").value = eventData.title;
    document.getElementById("evDay").value = eventData.dayIndex;
    document.getElementById("evStart").value = eventData.startTime;
    document.getElementById("evEnd").value = eventData.endTime;
    document.getElementById("evColor").value = eventData.color;
  } else {
    // Chế độ TẠO MỚI
    currentEditIndex = null;
    modalTitle.innerText = "Tạo sự kiện mới";
    btnDelete.style.display = "none"; // Ẩn nút Xóa
    form.reset();

    // Gợi ý giờ mặc định
    document.getElementById("evStart").value = "09:00";
    document.getElementById("evEnd").value = "10:30";
  }
}

function closeModal() {
  modal.style.display = "none";
  form.reset();
  currentEditIndex = null;
}

// Hàm Xóa sự kiện
function deleteEvent() {
  if (currentEditIndex !== null) {
    if (confirm("Bạn có chắc chắn muốn xóa sự kiện này không?")) {
      const events = getEvents();
      events.splice(currentEditIndex, 1); // Xóa khỏi mảng
      saveEvents(events); // Lưu lại
      renderEvents(); // Vẽ lại giao diện
      closeModal(); // Đóng Modal
    }
  }
}

// Xử lý khi bấm nút Lưu
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("evTitle").value;
  const dayIndex = document.getElementById("evDay").value;
  const startTime = document.getElementById("evStart").value;
  const endTime = document.getElementById("evEnd").value;
  const color = document.getElementById("evColor").value;

  if (startTime >= endTime) {
    alert("Giờ kết thúc phải lớn hơn giờ bắt đầu!");
    return;
  }

  const eventData = { title, dayIndex, startTime, endTime, color };
  const events = getEvents();

  if (currentEditIndex !== null) {
    // Nếu đang chỉnh sửa -> Cập nhật đè lên vị trí cũ
    events[currentEditIndex] = eventData;
  } else {
    // Nếu tạo mới -> Thêm vào cuối mảng
    events.push(eventData);
  }

  saveEvents(events);
  renderEvents();
  closeModal();
});

// Khởi tạo
initLayout();
renderEvents();

// Click ra ngoài modal thì đóng
window.onclick = function (event) {
  if (event.target == modal) closeModal();
};