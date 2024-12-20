/* /web/upload/js/module/estimation/script.js */

// 전역 변수 설정
let currentStep = 1;
const totalSteps = 3;

const formData = {
    moveType: '',
    currentAddress: '',
    currentDetailAddress: '',
    newAddress: '',
    newDetailAddress: '',
    hasStopover: false,
    stopoverAddress: '',
    stopoverDetailAddress: '',
    needsStorage: false,
    moveDate: '',
    moveSize: ''
};

// 이사 종류 선택 이벤트
document.addEventListener('DOMContentLoaded', function() {
    // Lucide 아이콘 초기화
    lucide.createIcons();
    
    // 현재 페이지 URL 확인
    const currentPath = window.location.pathname;
    
    // 메인 페이지의 이사 종류 선택 버튼 처리
    if (currentPath.endsWith('index.html') || currentPath === '/') {
        const moveTypeButtons = document.querySelectorAll('.move-type-buttons .select-button');
        moveTypeButtons.forEach(button => {
            button.addEventListener('click', function() {
                moveTypeButtons.forEach(btn => {
                    btn.classList.remove('active');
                    const btnIcon = btn.querySelector('.mt-1');
                    if (btnIcon) {
                        btnIcon.classList.remove('text-blue-600');
                        btnIcon.classList.add('text-gray-400');
                    }
                });
                
                this.classList.add('active');
                const icon = this.querySelector('.mt-1');
                if (icon) {
                    icon.classList.remove('text-gray-400');
                    icon.classList.add('text-blue-600');
                }
            });
        });
    }

    // 사무실이사 상세 페이지의 버튼들 처리
    if (currentPath.includes('office-moving-details.html')) {
        initializeOfficeMovingButtons();
    }

    // 엘리베이터 버튼 초기화
    initializeElevatorButtons();

    // 저장된 데이터 불러오기
    loadSavedData();

    // 자동 저장 초기화
    initAutoSave();
});

// 엘리베이터 버튼 초기화 함수
function initializeElevatorButtons() {
    const elevatorButtons = document.querySelectorAll('.elevator-button');
    if (elevatorButtons.length > 0) {
        elevatorButtons.forEach(button => {
            button.addEventListener('click', function() {
                const target = this.dataset.target;
                document.querySelectorAll(`.elevator-button[data-target="${target}"]`)
                    .forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                savePageData();
            });
        });

        // 엘리베이터 있음 버튼을 기본으로 활성화
        document.querySelectorAll('.elevator-button[data-value="yes"]').forEach(button => {
            button.classList.add('active');
        });
    }
}

// 사무실이사 버튼 초기화 함수
function initializeOfficeMovingButtons() {
    // 사무실 평수 버튼
    const houseSizeButtons = document.querySelectorAll('.house-size .select-button');
    houseSizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            houseSizeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            savePageData();
        });
    });

    // 사무실 용도 버튼
    const officeTypeButtons = document.querySelectorAll('.office-type .select-button');
    officeTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            officeTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const otherInput = document.getElementById('otherOfficeType');
            if (otherInput) {
                otherInput.style.display = this.dataset.value === '기타' ? 'block' : 'none';
                if (this.dataset.value !== '기타') {
                    otherInput.value = '';
                }
            }
            savePageData();
        });
    });

    // 온풍기 유무 버튼
    const heaterButtons = document.querySelectorAll('.heater-exists .select-button');
    heaterButtons.forEach(button => {
        button.addEventListener('click', function() {
            heaterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            savePageData();
        });
    });
}

// 로딩 표시 함수
function showLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
        loading.style.display = 'flex';
    }
}

// 로딩 숨기기 함수
function hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
        loading.style.display = 'none';
    }
}

// 페이지 이동 함수 수정
function goToMoveType() {
    const selectedButton = document.querySelector('.select-button.active');
    if (!selectedButton) {
        alert('이사 종류를 선택해주세요.');
        return;
    }

    showLoading();
    const moveType = selectedButton.dataset.value;
    localStorage.setItem('moveType', moveType);
    
    setTimeout(() => {
        switch(moveType) {
            case '가정이사':
                window.location.href = 'home-moving.html';
                break;
            case '소형이사':
                window.location.href = 'small-moving.html';
                break;
            case '사무실이사':
                window.location.href = 'office-moving.html';
                break;
        }
    }, 800);
}

// 날짜 관련 변수
let currentDate = new Date();
let selectedDate = null;

// 손 없는 날 데이터
const specialDates = {
    '2024-12': ['9', '10', '19', '20', '29', '30', '31'],
    '2025-1': ['1', '10', '19', '20', '29', '30', '31'],
    '2025-2': ['8', '9', '18', '19', '28', '26', '27'],
    '2025-3': ['9', '18', '19', '28', '29', '31'],
    '2025-4': ['7', '8', '17', '18', '27', '28'],
    '2025-5': ['7', '16', '17', '26', '27'],
    '2025-6': ['5', '14', '15', '24', '25'],
    '2025-7': ['4', '5', '14', '15', '24', '25'],
    '2025-8': ['3', '12', '13', '22', '23'],
    '2025-9': ['1', '2', '11', '12', '21', '22'],
    '2025-10': ['1', '2', '11', '12', '21', '22', '31'],
    '2025-11': ['9', '10', '19', '20', '29', '30'],
    '2025-12': ['9', '10', '19', '20', '29', '30']
};

// 날짜 모달 열기
function openDateModal() {
    document.getElementById('dateModal').style.display = 'flex';
    
    // 선택된 날짜가 있으면 해당 월을 보여주고, 없으면 현재 월을 보여줌
    if (selectedDate) {
        currentDate = new Date(selectedDate);
    } else {
        currentDate = new Date();
    }
    
    renderCalendar();
}

// 날짜 모달 닫기
function closeDateModal() {
    document.getElementById('dateModal').style.display = 'none';
}

// 달력 렌더링 함수 수정
function renderCalendar() {
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const monthYearElement = document.getElementById('currentMonthYear');
        if (!monthYearElement) return;
        monthYearElement.textContent = `${year}년 ${month + 1}월`;
        
        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;
        
        calendarDays.innerHTML = '';
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        // 빈 날짜 채우기
        for (let i = 0; i < startingDay; i++) {
            calendarDays.appendChild(createDayElement(''));
        }
        
        // 날짜 채우기
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = createDayElement(day);
            
            // 오늘 이전 날짜만 선택 불가능하게 설정
            if (date < today) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(date));
            }
            
            if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }
            
            calendarDays.appendChild(dayElement);
        }
    } catch (error) {
        console.error('Calendar rendering error:', error);
    }
}

// 이전 달로 이동 함수 수정
function prevMonth(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const prevDate = new Date(currentDate);
    prevDate.setMonth(currentDate.getMonth() - 1);
    currentDate = new Date(prevDate);
    renderCalendar();
}

// 다음 달로 이동 함수 수정
function nextMonth(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const nextDate = new Date(currentDate);
    nextDate.setMonth(currentDate.getMonth() + 1);
    currentDate = new Date(nextDate);
    renderCalendar();
}

// 날짜 요소 생성
function createDayElement(day) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    
    if (day === '') {
        div.classList.add('empty');
        div.textContent = day;
        return div;
    }

    // 날짜 컨테이너 생성
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';
    
    // 날짜 텍스트
    const dateText = document.createElement('span');
    dateText.textContent = day;
    dateContainer.appendChild(dateText);
    
    // 손 없는 날 표시
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateKey = `${year}-${month}`;
    
    if (specialDates[dateKey] && specialDates[dateKey].includes(day.toString())) {
        const dot = document.createElement('span');
        dot.className = 'special-date-dot';
        dateContainer.appendChild(dot);
    }
    
    div.appendChild(dateContainer);
    return div;
}

// 날짜 선택
function selectDate(date) {
    selectedDate = date;
    document.getElementById('moveDateInput').value = 
        date.toLocaleDateString('ko-KR');
    closeDateModal();
}

// 다음 단계로 이동하는 함수 수정
function goToNextStep() {
    // 소형이사 페이지에서는 이 함수를 사용하지 않도록 처리
    if (location.pathname.includes('small-moving')) {
        return;
    }

    const dateInput = document.getElementById('moveDateInput');
    if (!dateInput.value) {
        alert('이사 희망일을 선택해주세요.');
        return;
    }
    
    showLoading();
    
    // 현재 이사 종류 확인 - URL 기반으로 판단
    let moveType;
    let nextPage;
    
    if (location.pathname.includes('home-moving')) {
        moveType = '가정이사';
        nextPage = 'home-moving-details.html';
    } else if (location.pathname.includes('office-moving')) {
        moveType = '사무실이사';
        nextPage = 'office-moving-details.html';
    }
    
    // 데이터 저장
    saveFormData('moveDate', dateInput.value);
    saveFormData('isFlexible', document.querySelector('input[name="isFlexible"]').checked);
    saveFormData('needsStorage', document.querySelector('input[name="needsStorage"]').checked);
    
    setTimeout(() => {
        location.href = nextPage;
    }, 800);
}

// 주소 검색
function searchAddress(type) {
    const modalTitle = type === 'start' ? '출발지 주소 검색' : '도착지 주소 검색';
    
    // 모달 생성
    const modalDiv = document.createElement('div');
    modalDiv.className = 'address-modal';
    modalDiv.innerHTML = `
        <div class="address-modal-content">
            <div class="modal-header">
                <h3>${modalTitle}</h3>
                <button type="button" class="close-button" onclick="this.closest('.address-modal').remove()">×</button>
            </div>
            <div id="address-search-container-${type}"></div>
        </div>
    `;
    
    document.body.appendChild(modalDiv);

    new daum.Postcode({
        oncomplete: function(data) {
            const addressInput = document.getElementById(type + 'Address');
            addressInput.value = data.address;
            modalDiv.remove();
            
            // 주소 선택 후 데이터 저장
            savePageData();
        },
        onclose: function() {
            modalDiv.remove();
        }
    }).embed(document.getElementById(`address-search-container-${type}`));
}

// 상세 정보 제출
function submitDetails() {
    let moveData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    
    // 필수 입력값 검증
    const startAddress = document.getElementById('startAddress').value;
    const endAddress = document.getElementById('endAddress').value;
    const startFloor = document.querySelector('select[name="startFloor"]').value;
    const endFloor = document.querySelector('select[name="endFloor"]').value;
    const houseSize = document.querySelector('.house-size .select-button.active')?.dataset.value;
    const familySize = document.querySelector('.family-size .select-button.active')?.dataset.value;
    
    if (!startAddress) {
        alert('출발지 주소를 입력해주세요.');
        return;
    }
    if (!startFloor) {
        alert('출발지 층수를 선택해주세요.');
        return;
    }
    if (!endAddress) {
        alert('도착지 주소를 입력해주세요.');
        return;
    }
    if (!endFloor) {
        alert('도착지 층수를 선택해주세요.');
        return;
    }
    if (!houseSize) {
        alert('집 평수를 선택해주세요.');
        return;
    }
    if (!familySize) {
        alert('가구 인원수를 선택해주세요.');
        return;
    }
    
    // 데이터 저장
    moveData = {
        ...moveData,
        startAddress: startAddress,
        startFloor: startFloor,
        startHalfStairs: document.querySelector('input[name="startHalfStairs"]').checked,
        startElevator: document.querySelector('.elevator-button[data-target="start"].active')?.dataset.value || 'yes',
        
        endAddress: endAddress,
        endFloor: endFloor,
        endHalfStairs: document.querySelector('input[name="endHalfStairs"]').checked,
        endElevator: document.querySelector('.elevator-button[data-target="end"].active')?.dataset.value || 'yes',
        
        houseSize: houseSize,
        familySize: familySize,
        lastMoveTonnage: document.querySelector('select[name="lastMoveTonnage"]').value || '이전이사없음'
    };
    
    localStorage.setItem('moveQuoteData', JSON.stringify(moveData));
    window.location.href = 'home-moving-final.html';
}

// 입력 값 검증
function validateDetails() {
    const startAddress = document.getElementById('startAddress').value;
    const endAddress = document.getElementById('endAddress').value;
    const startFloor = document.querySelector('select[name="startFloor"]').value;
    const endFloor = document.querySelector('select[name="endFloor"]').value;
    
    if (!startAddress) {
        alert('출발지 주소를 입력해주세요.');
        return false;
    }
    if (!endAddress) {
        alert('도착지 주소를 입력해주세요.');
        return false;
    }
    if (!startFloor) {
        alert('출발지 층수를 선택해주세요.');
        return false;
    }
    if (!endFloor) {
        alert('도착지 층수를 선택해주세요.');
        return false;
    }
    
    // 선택사항은 검증에서 제외
    return true;
}

// 임시 저장 데이터 키 상수 정의
const TEMP_STORAGE_KEY = 'moveQuoteTemp';

// 페이지별 데이터 저장 함수 수정
function savePageData() {
    const moveData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    
    // 주소 정보 저장
    const startAddress = document.getElementById('startAddress')?.value;
    const endAddress = document.getElementById('endAddress')?.value;
    if (startAddress) moveData.startAddress = startAddress;
    if (endAddress) moveData.endAddress = endAddress;

    // 층수 정보 저장
    const startFloor = document.querySelector('input[name="startFloor"]')?.value;
    const endFloor = document.querySelector('input[name="endFloor"]')?.value;
    if (startFloor) moveData.startFloor = startFloor;
    if (endFloor) moveData.endFloor = endFloor;

    // 엘리베이터 정보 저장
    const startElevator = document.querySelector('.elevator-button[data-target="start"].active')?.dataset.value;
    const endElevator = document.querySelector('.elevator-button[data-target="end"].active')?.dataset.value;
    if (startElevator) moveData.startElevator = startElevator;
    if (endElevator) moveData.endElevator = endElevator;

    localStorage.setItem('moveQuoteData', JSON.stringify(moveData));
}

// 저장된 데이터 불러오기 함수
function loadSavedData() {
    const savedData = JSON.parse(localStorage.getItem(TEMP_STORAGE_KEY) || '{}');
    
    // 현재 URL에 따라 다른 데이터 로드
    if (location.pathname.includes('home-moving.html')) {
        if (savedData.moveDate) document.getElementById('moveDateInput').value = savedData.moveDate;
        if (savedData.isFlexible) document.querySelector('input[name="isFlexible"]').checked = savedData.isFlexible;
        if (savedData.needsStorage) document.querySelector('input[name="needsStorage"]').checked = savedData.needsStorage;
    }
    else if (location.pathname.includes('home-moving-details.html')) {
        if (savedData.startAddress) document.getElementById('startAddress').value = savedData.startAddress;
        if (savedData.startFloor) document.querySelector('select[name="startFloor"]').value = savedData.startFloor;
        if (savedData.startHalfStairs) document.querySelector('input[name="startHalfStairs"]').checked = savedData.startHalfStairs;
        if (savedData.startElevator) {
            document.querySelectorAll('.elevator-button[data-target="start"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === savedData.startElevator);
            });
        }
        
        if (savedData.endAddress) document.getElementById('endAddress').value = savedData.endAddress;
        if (savedData.endFloor) document.querySelector('select[name="endFloor"]').value = savedData.endFloor;
        if (savedData.endHalfStairs) document.querySelector('input[name="endHalfStairs"]').checked = savedData.endHalfStairs;
        if (savedData.endElevator) {
            document.querySelectorAll('.elevator-button[data-target="end"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === savedData.endElevator);
            });
        }
        
        if (savedData.houseSize) {
            document.querySelectorAll('.house-size .select-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === savedData.houseSize);
            });
        }
        if (savedData.familySize) {
            document.querySelectorAll('.family-size .select-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === savedData.familySize);
            });
        }
        if (savedData.lastMoveTonnage) document.querySelector('select[name="lastMoveTonnage"]').value = savedData.lastMoveTonnage;
    }
    else if (location.pathname.includes('home-moving-final.html')) {
        if (savedData.name) document.querySelector('input[name="name"]').value = savedData.name;
        if (savedData.phone) document.querySelector('input[name="phone"]').value = savedData.phone;
        if (savedData.specialItems) {
            savedData.specialItems.forEach(item => {
                const checkbox = document.querySelector(`input[name="specialItems"][value="${item}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        if (savedData.memo) document.querySelector('textarea[name="memo"]').value = savedData.memo;
    }
}

// 입력 필드 변경 감지 및 자동 저장
function initAutoSave() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', savePageData);
        input.addEventListener('input', savePageData);
    });
    
    // 버튼 클릭 이벤트도 감지
    document.querySelectorAll('.select-button, .elevator-button').forEach(button => {
        button.addEventListener('click', savePageData);
    });
}

// 견적 신청 완료 시 임시 데이터 삭제
function clearTempData() {
    localStorage.removeItem(TEMP_STORAGE_KEY);
}

// 페이지 로드 시 저장된 데이터 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    initAutoSave();
});

// 견적 신청 완료 시 임시 데이터 삭제
async function submitFinalForm(event) {
    event.preventDefault();
    
    const form = document.getElementById('finalForm');
    const phone = form.querySelector('input[name="phone"]');
    
    if (!/^[0-9]{10,11}$/.test(phone.value)) {
        alert('올바른 전화번호를 입력해주세요.');
        phone.focus();
        return false;
    }
    
    if (!form.querySelector('input[name="privacyAgreement"]').checked) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return false;
    }
    
    showLoading();

    try {
        // 폼 데이터 저장
        const moveData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
        
        // 기본 정보 저장
        moveData.name = form.querySelector('[name="name"]').value;
        moveData.phone = form.querySelector('[name="phone"]').value;
        moveData.memo = form.querySelector('[name="memo"]')?.value || '';
        
        // 특수 이사 품목 저장 (가정이사)
        const specialItems = Array.from(form.querySelectorAll('[name="specialItems"]:checked'))
            .map(item => item.value);
        if (specialItems.length) {
            moveData.specialItems = specialItems;
        }
        
        // 저장된 데이터 업데이트
        localStorage.setItem('moveQuoteData', JSON.stringify(moveData));

        // 현재 페이지 URL을 기반으로 moveType 결정
        let moveType;
        if (location.pathname.includes('home-moving')) {
            moveType = '가정이사';
        } else if (location.pathname.includes('office-moving')) {
            moveType = '사무실이사';
        } else if (location.pathname.includes('small-moving')) {
            moveType = '소형이사';
        }

        // Discord 웹훅 전송
        const webhookUrl = getWebhookUrl(moveType);
        const embedData = getAdditionalFields(moveType, moveData)[0];
        const message = {
            embeds: [{
                title: embedData.name,
                color: embedData.color,
                description: embedData.value,
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });

        if (response.ok) {
            // 이사 종류별 결과 페이지로 이동
            if (moveType === '가정이사') {
                window.location.href = 'home-moving-result.html';
            } else if (moveType === '사무실이사') {
                window.location.href = 'office-moving-result.html';
            } else if (moveType === '소형이사') {
                window.location.href = 'small-moving-result.html';
            }
        } else {
            throw new Error('웹훅 전송 실패');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        hideLoading();
    }

    return false;
}

// 이사 종류별 웹훅 URL 가져오기
function getWebhookUrl(moveType) {
    return 'https://discord.com/api/webhooks/1316231070441803816/3ELVqV5Qu73OT5L1ekSKGeqRfDXgyQMdNmRZBu840XZpsMgBbFqdiOIKVSNGkT_Tw1Ck';
}

// 이사 종류별 추가 필드 생성 함수 수정
function getAdditionalFields(moveType, savedData) {
    // 층수 표시 헬퍼 함수
    function getFloorText(floor) {
        if (floor === '-1') return '반지하';
        if (floor === '26') return '26층 이상';
        return floor + '층';
    }

    switch(moveType) {
        case '가정이사':
            return [{
                name: '🏠 가정 이사 견적신청',
                color: 0x00ff00, // 초록색
                value: [
                    `**신청자:** ${savedData.name || '-'} / ${savedData.phone || '-'}`,
                    `**이사일정:** ${savedData.moveDate || '-'} ${savedData.isFlexible ? '(날짜조정가능)' : '(날짜확정)'} / ${savedData.needsStorage ? '보관이사필요' : '보관이사없음'}`,
                    '',
                    `**출발지:** ${savedData.startAddress || '-'}`,
                    `⤷ ${getFloorText(savedData.startFloor)}${savedData.startHalfStairs ? ' (반계단)' : ''} / ${savedData.startElevator === 'yes' ? '엘베○' : '엘베×'}`,
                    '',
                    `**도착지:** ${savedData.endAddress || '-'}`,
                    `⤷ ${getFloorText(savedData.endFloor)}${savedData.endHalfStairs ? ' (반계단)' : ''} / ${savedData.endElevator === 'yes' ? '엘베○' : '엘베×'}`,
                    '',
                    `**이사규모:** ${savedData.houseSize || '-'}평 / ${savedData.familySize || '-'}인 / ${savedData.lastMoveTonnage ? savedData.lastMoveTonnage + '톤' : '이전이사없음'}`,
                    `**특수품목:** ${savedData.specialItems?.length > 0 ? savedData.specialItems.join(', ') : '없음'}`,
                    `**메모:** ${savedData.memo || '없음'}`
                ].join('\n'),
                inline: false
            }];

        case '사무실이사':
            return [{
                name: '🏢 사무실 이사 견적신청',
                color: 0x0099ff, // 파란색
                value: [
                    `**신청자:** ${savedData.name || '-'} / ${savedData.phone || '-'}`,
                    `**이사일정:** ${savedData.moveDate || '-'} ${savedData.isFlexible ? '(날짜조정가능)' : '(날짜확정)'}`,
                    '',
                    `**출발지:** ${savedData.startAddress || '-'}`,
                    `⤷ ${getFloorText(savedData.startFloor)}${savedData.startHalfStairs ? ' (반계단)' : ''} / ${savedData.startElevator === 'yes' ? '엘베○' : '엘베×'}`,
                    '',
                    `**도착지:** ${savedData.endAddress || '-'}`,
                    `⤷ ${getFloorText(savedData.endFloor)}${savedData.endHalfStairs ? ' (반계단)' : ''} / ${savedData.endElevator === 'yes' ? '엘베○' : '엘베×'}`,
                    '',
                    `**사무실정보:** ${savedData.officeSize || '-'}평 / ${savedData.employeeCount || '-'}명`,
                    `**사무실용도:** ${savedData.officeType || '-'}`,
                    `**온풍기:** ${savedData.hasHeater === 'yes' ? '있음' : '없음'}`,
                    `**메모:** ${savedData.memo || '없음'}`
                ].join('\n'),
                inline: false
            }];

        case '소형이사':
            return [{
                name: '📦 소형 이사 견적신청',
                color: 0xffff00, // 노란색
                value: [
                    `**신청자:** ${savedData.name || '-'} / ${savedData.phone || '-'}`,
                    `**이사일정:** ${savedData.moveDate || '-'} ${savedData.isFlexible ? '(날짜조정가능)' : '(날짜확정)'} / ${savedData.needsStorage ? '보관이사필요' : '보관이사없음'}`,
                    '',
                    `**출발지:** ${savedData.startAddress || '-'}`,
                    `⤷ ${getFloorText(savedData.startFloor)}${savedData.startHalfStairs ? ' (반계단)' : ''} / ${savedData.startElevator === 'yes' ? '엘베○' : '엘베×'}`,
                    '',
                    `**도착지:** ${savedData.endAddress || '-'}`,
                    `⤷ ${getFloorText(savedData.endFloor)}${savedData.endHalfStairs ? ' (반계단)' : ''} / ${savedData.endElevator === 'yes' ? '엘베○' : '엘베×'}`,
                    '',
                    `**이사종류:** ${savedData.moveSubType || '-'}`,
                    '',
                    `**선택한 물품:**\n${savedData.selectedItems?.map(item => {
                        let text = `⤷ ${item.name}`;
                        if (item.options) {
                            const optionTexts = [];
                            if (item.options.quantity) optionTexts.push(`${item.options.quantity}개`);
                            if (item.options.size) optionTexts.push(item.options.size);
                            if (item.options.type) optionTexts.push(item.options.type);
                            if (item.options.assembly) optionTexts.push(item.options.assembly === '필요' ? '분해필요' : '분해불필요');
                            if (optionTexts.length) text += ` (${optionTexts.join(', ')})`;
                        }
                        return text;
                    }).join('\n') || '없음'}`,
                    '',
                    `**잔짐 박스:** ${savedData.boxCount || '-'}`,
                    `**1톤 용달:** ${savedData.truckCount}대`,
                    `**메모:** ${savedData.memo || '없음'}`
                ].join('\n'),
                inline: false
            }];
    }
    return [];
}

// 폼 데이터 저장 함수 수정
function saveFormData(key, value) {
    const moveData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    moveData[key] = value;
    localStorage.setItem('moveQuoteData', JSON.stringify(moveData));
}

// 페이지 데이터 저장 함수 수정
function savePageData() {
    const moveData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    
    // 주소 정보 저장
    const startAddress = document.getElementById('startAddress')?.value;
    const endAddress = document.getElementById('endAddress')?.value;
    if (startAddress) moveData.startAddress = startAddress;
    if (endAddress) moveData.endAddress = endAddress;

    // 층수 정보 저장
    const startFloor = document.querySelector('input[name="startFloor"]')?.value;
    const endFloor = document.querySelector('input[name="endFloor"]')?.value;
    if (startFloor) moveData.startFloor = startFloor;
    if (endFloor) moveData.endFloor = endFloor;

    // 엘리베이터 정보 저장
    const startElevator = document.querySelector('.elevator-button[data-target="start"].active')?.dataset.value;
    const endElevator = document.querySelector('.elevator-button[data-target="end"].active')?.dataset.value;
    if (startElevator) moveData.startElevator = startElevator;
    if (endElevator) moveData.endElevator = endElevator;

    localStorage.setItem('moveQuoteData', JSON.stringify(moveData));
}

// 페이지 로드 완료 시 로딩 숨기기
document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
});

// 개인정보 동의 모달 표시
function showPrivacyModal(event) {
    event.preventDefault();
    document.getElementById('privacyModal').style.display = 'flex';
}

// 개인정보 동의 모달 닫기
function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
    // 체크박스 체크
    document.querySelector('input[name="privacyAgreement"]').checked = true;
}

// 모달 외부 클릭 시에도 체크박스 체크 (선택사항)
document.addEventListener('click', function(event) {
    const modal = document.getElementById('privacyModal');
    if (event.target === modal) {
        closePrivacyModal();
    }
});

// 견적 신청 완료 페이지에서 이사 종류와 상세 정보 표시
if (location.pathname.includes('-final.html')) {
    const moveType = localStorage.getItem('moveType');
    const savedData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    
    // 이사 종류 표시
    document.getElementById('summaryMoveType').textContent = moveType || '-';
    
    // 사무실이사인 경우 추가 정보 표시
    if (moveType === '사무실이사') {
        // 사무실 평수
        if (savedData.officeSize) {
            document.getElementById('summarySize').textContent = 
                savedData.officeSize === '0-15' ? '15평 이하' : '15평 이상';
        }
        
        // 직원 수
        if (savedData.employeeCount) {
            let employeeCount = savedData.employeeCount;
            if (employeeCount === 'direct' && savedData.directEmployeeCount) {
                employeeCount = `${savedData.directEmployeeCount}명`;
            }
            document.getElementById('summaryEmployeeCount').textContent = employeeCount;
        }
        
        // 사무실 용도
        if (savedData.officeType) {
            let officeType = savedData.officeType;
            if (officeType === '기타' && savedData.otherOfficeType) {
                officeType = `기타(${savedData.otherOfficeType})`;
            }
            document.getElementById('summaryOfficeType').textContent = officeType;
        }
        
        // 온풍기 유무
        if (savedData.hasHeater) {
            document.getElementById('summaryHasHeater').textContent = 
                savedData.hasHeater === 'yes' ? '있음' : '없음';
        }
    }
}

// 버튼 그룹 이벤트 핸들러 수정
document.addEventListener('DOMContentLoaded', function() {
    // 각 버튼 그룹에 대한 독립적인 이벤트 리스너 추가
    function addButtonGroupListener(containerSelector) {
        const buttons = document.querySelectorAll(`${containerSelector} .select-button`);
        if (!buttons.length) return;

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                // 같은 그룹 내의 다른 버튼들만 비활성화
                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // 기타 입력 필드 처리 (사무실 용도인 경우)
                if (containerSelector === '.office-type') {
                    const otherInput = document.getElementById('otherOfficeType');
                    if (otherInput) {
                        otherInput.style.display = this.dataset.value === '기타' ? 'block' : 'none';
                        if (this.dataset.value !== '기타') {
                            otherInput.value = '';
                        }
                    }
                }

                savePageData();
            });
        });
    }

    // 각 버튼 그룹에 대해 독립적으로 이벤트 리스너 추가
    addButtonGroupListener('.house-size');      // 현재 사무실 평수
    addButtonGroupListener('.office-type');     // 사무실 용도
    addButtonGroupListener('.heater-exists');   // 온풍기 유무
});

// 소형이사 이사종류 선택 후 다음 단계로 이동
function goToItemSelection() {
    const selectedItem = document.querySelector('.move-type-item.active');
    if (!selectedItem) {
        alert('이사 종류를 선택해주세요.');
        return;
    }

    showLoading();
    // 선택한 이사 종류 저장
    saveFormData('smallMoveType', selectedItem.dataset.value);
    
    setTimeout(() => {
        location.href = 'small-moving-items.html';
    }, 800);
}

// 소형이사 짐 내용 선택 후 다음 단계로 이동
function goToSmallMoveDetails() {
    // 가구 선택 항목 저장
    const selectedFurniture = Array.from(document.querySelectorAll('input[name="furniture"]:checked'))
        .map(input => input.value);
    
    // 가전 선택 항목 저장
    const selectedAppliances = Array.from(document.querySelectorAll('input[name="appliances"]:checked'))
        .map(input => input.value);
    
    // 소형가전 선택 항목 저장
    const selectedSmallAppliances = Array.from(document.querySelectorAll('input[name="small-appliances"]:checked'))
        .map(input => input.value);
    
    // 박스 개수 저장
    const selectedBoxCount = document.querySelector('.box-count-option.selected')?.dataset.value;
    
    if (!selectedBoxCount) {
        alert('잔짐(박스) 개수를 선택해주세요.');
        return;
    }

    // 최소한 하나의 항목은 선택되어야 함
    if (selectedFurniture.length === 0 && selectedAppliances.length === 0 && selectedSmallAppliances.length === 0) {
        alert('가구, 가전, 소형가전 중 최소 한 가지는 선택해주세요.');
        return;
    }

    showLoading();
    
    // 선택한 내용 저장
    saveFormData('furniture', selectedFurniture);
    saveFormData('appliances', selectedAppliances);
    saveFormData('smallAppliances', selectedSmallAppliances);
    saveFormData('boxCount', selectedBoxCount);
    
    setTimeout(() => {
        location.href = 'small-moving-details.html';
    }, 800);
}

// script.js에 침대 관련 함수 추가
function saveBedOptions(options) {
    const savedData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    savedData.bedOptions = options;
    localStorage.setItem('moveQuoteData', JSON.stringify(savedData));
}

// 견적 완료 페이지에서 침대 옵션 표시
if (location.pathname.includes('-final.html')) {
    const savedData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    if (savedData.bedOptions) {
        const { size, frame, assembly } = savedData.bedOptions;
        // 침대 옵션 정보 표시 로직 추가
    }
}

// simple-item 관련 코드 수정
document.querySelectorAll('.simple-item').forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const quantityDisplay = card.querySelector('.item-quantity');
    const quantityControls = card.querySelector('.quantity-controls');
    const input = quantityControls?.querySelector('.quantity-input-small');

    // 초기값 설정
    input.value = 1;

    // 초기 상태 설정
    function updateCardState(isSelected) {
        // 선택 상태 업데이트
        card.classList.toggle('selected', isSelected);
        checkbox.checked = isSelected;

        // 수량 관련 UI 업데이트
        if (isSelected) {
            quantityDisplay.style.display = 'block';
            quantityControls.style.display = 'flex';
            quantityDisplay.textContent = `${input.value}개`;
        } else {
            // 선택 해제 시 모든 상태 초기화
            quantityDisplay.style.display = 'none';
            quantityControls.style.display = 'none';
            input.value = 1;
            quantityDisplay.textContent = '';
        }
    }

    // 초기 상태 적용
    updateCardState(checkbox.checked);

    // 카드 클릭 이벤트
    card.addEventListener('click', function(e) {
        // 수량 조절 영역 클릭은 무시
        if (e.target.closest('.quantity-controls')) {
            return;
        }

        // 현재 상태의 반대로 토글
        const newState = !checkbox.checked;
        updateCardState(newState);
    });

    // 수량 조절 버튼 이벤트
    if (quantityControls) {
        // 마이너스 버튼 이벤트
        const minusBtn = quantityControls.querySelector('.minus');
        minusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            if (!checkbox.checked) {
                updateCardState(true);
            }

            let value = parseInt(input.value);
            if (value > 1) {
                value--;
                input.value = value;
                quantityDisplay.textContent = `${value}개`;
            }
        });

        // 플러스 버튼 이벤트
        const plusBtn = quantityControls.querySelector('.plus');
        plusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            if (!checkbox.checked) {
                updateCardState(true);
            }

            let value = parseInt(input.value);
            if (value < 99) {
                value++;
                input.value = value;
                quantityDisplay.textContent = `${value}개`;
            }
        });

        // 수량 입력 직접 변경 시
        input.addEventListener('change', function(e) {
            e.stopPropagation();
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) value = 1;
            if (value > 99) value = 99;
            this.value = value;

            if (checkbox.checked) {
                quantityDisplay.textContent = `${value}개`;
            }
        });
    }
});

// 아이템별 옵션 라벨 정의
const optionLabels = {
    bed: {
        size: '크기',
        frame: '프레임',
        assembly: '분해조립'
    },
    wardrobe: {
        width: '너비'
    },
    bookshelf: {
        width: '너비',
        height: '높이'
    },
    desk: {
        type: '종류',
        size: '크기'
    },
    chair: {
        type: '종류'
    },
    table: {
        type: '종류',
        size: '크기'
    },
    sofa: {
        size: '크기'
    },
    dressingTable: {
        type: '종류'
    },
    cabinet: {
        type: '종류'
    },
    drawer: {
        type: '종류'
    },
    tv: {
        type: '종류',
        assembly: '분해조립'
    },
    washingMachine: {
        type: '종류',
        size: '크기'
    },
    dryer: {
        size: '크기'
    },
    airConditioner: {
        type: '종류',
        separation: '분리작업'
    },
    refrigerator: {
        type: '종류'
    },
    clothesManager: {}
};

// 선택된 옵션 업데이트 함수
function updateSelectedOptions(type) {
    const modal = document.getElementById(`${type}Modal`);
    const options = itemOptions[type];
    const selectedOptionsDiv = modal.querySelector('.selected-options');
    let optionsHTML = '';

    // 아이템별 옵션 표시
    Object.entries(optionLabels[type] || {}).forEach(([key, label]) => {
        optionsHTML += `
            <div class="selected-option-item">
                <span class="selected-option-label">${label}:</span>
                <span class="selected-option-value">${options[key] || '선택 필요'}</span>
            </div>
        `;
    });

    // 수량 추가
    optionsHTML += `
        <div class="selected-option-item">
            <span class="selected-option-label">수량:</span>
            <span class="selected-option-value">${options.quantity}개</span>
        </div>
    `;

    selectedOptionsDiv.innerHTML = optionsHTML;
}

// 옵션 버튼 클릭 이벤트 수정
document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('click', function() {
        const type = this.dataset.type;
        const value = this.dataset.value;
        const modalId = this.closest('.modal').id;
        const itemType = modalId.replace('Modal', '');
        
        // 같은 그룹의 다른 버튼들 선택 해제
        document.querySelectorAll(`.option-button[data-type="${type}"]`).forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.classList.add('selected');
        itemOptions[itemType][type] = value;
        
        // 선택된 옵션 표시 업데이트
        updateSelectedOptions(itemType);
    });
});

// 수량 변경 시에도 선택된 옵션 업데이트
document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const modalId = this.closest('.modal').id;
        const itemType = modalId.replace('Modal', '');
        updateSelectedOptions(itemType);
    });
});

// 선택된 아이템과 옵션 저장
function saveSelectedItems() {
    const selectedItems = {};
    
    // 선택된 모든 체크박스 확인
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        const itemType = checkbox.value;
        if (checkbox.dataset.options) {
            selectedItems[itemType] = JSON.parse(checkbox.dataset.options);
        }
    });
    
    // localStorage에 저장
    const savedData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    savedData.selectedItems = selectedItems;
    localStorage.setItem('moveQuoteData', JSON.stringify(savedData));
}

// 견적 완료 페이지에서 선택된 아이템 표시
if (location.pathname.includes('-final.html')) {
    const savedData = JSON.parse(localStorage.getItem('moveQuoteData') || '{}');
    const selectedItems = savedData.selectedItems || {};
    
    const itemContainer = document.getElementById('selectedItemsList');
    if (itemContainer && Object.keys(selectedItems).length > 0) {
        Object.entries(selectedItems).forEach(([itemType, options]) => {
            const itemHTML = `
                <div class="selected-item">
                    <h4>${itemType}</h4>
                    <div class="item-options">
                        ${Object.entries(options)
                            .map(([key, value]) => `
                                <div class="option-item">
                                    <span class="option-label">${key}:</span>
                                    <span class="option-value">${value}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            `;
            itemContainer.innerHTML += itemHTML;
        });
    }
}

// 아이템 옵션 확인 함수 수정
function confirmItemOptions(type) {
    const options = itemOptions[type];
    let missingOption = '';

    // 각 아이템별 필수 옵션 체크
    switch(type) {
        case 'bed':
            if (!options.size) missingOption = '크기를';
            else if (!options.frame) missingOption = '프레임을';
            else if (!options.assembly) missingOption = '분해조립 여부를';
            break;
        case 'bookshelf':
            if (!options.width) missingOption = '너비를';
            else if (!options.height) missingOption = '높이를';
            break;
        case 'desk':
            if (!options.type) missingOption = '종류를';
            else if (!options.size) missingOption = '크기를';
            break;
        case 'chair':
            if (!options.type) missingOption = '종류를';
            break;
        case 'table':
            if (!options.type) missingOption = '종류를';
            else if (!options.size) missingOption = '크기를';
            break;
        case 'sofa':
            if (!options.size) missingOption = '크기를';
            break;
        case 'dressingTable':
            if (!options.type) missingOption = '종류를';
            break;
        case 'cabinet':
            if (!options.type) missingOption = '종류를';
            break;
        case 'drawer':
            if (!options.type) missingOption = '종류를';
            break;
        case 'tv':
            if (!options.type) missingOption = '종류를';
            else if (!options.assembly) missingOption = '분해조립 여부를';
            break;
        case 'washingMachine':
            if (!options.type) missingOption = '종류를';
            else if (!options.size) missingOption = '크기를';
            break;
        case 'dryer':
            if (!options.size) missingOption = '크기를';
            break;
        case 'airConditioner':
            if (!options.type) missingOption = '종류를';
            else if (!options.separation) missingOption = '분리작업 여부를';
            break;
        case 'refrigerator':
            if (!options.type) missingOption = '종류를';
            break;
        // ... 다른 케이스들 ...
    }

    if (missingOption) {
        alert(`${missingOption} 선택해주세요.`);
        return;
    }

    // 선택된 옵션 저장 및 시각적 피드백
    const checkbox = document.querySelector(`input[value="${getKoreanType(type)}"]`);
    if (checkbox) {
        checkbox.dataset.options = JSON.stringify(options);
        checkbox.checked = true;
        
        const card = checkbox.closest('.item-card');
        if (card) {
            card.classList.add('selected');
            
            // 수량 표시 업데이트
            const quantityDisplay = card.querySelector('.item-quantity');
            if (quantityDisplay) {
                quantityDisplay.style.display = 'block';
                quantityDisplay.textContent = `${options.quantity || 1}개`;
            }
            
            // 옵션 정보 요약 표시
            const summaryDisplay = card.querySelector('.item-options-summary');
            if (summaryDisplay) {
                let summary = [];
                // 가전제품별 특화된 옵션 표시
                switch(type) {
                    case 'tv':
                        if (options.type) summary.push(`${options.type}`);
                        if (options.assembly) summary.push(options.assembly === '필요' ? '분해필요' : '분해불필요');
                        break;
                    case 'washingMachine':
                        if (options.type) summary.push(`${options.type}`);
                        if (options.size) summary.push(`${options.size}`);
                        break;
                    case 'dryer':
                        if (options.size) summary.push(`${options.size}`);
                        break;
                    case 'airConditioner':
                        if (options.type) summary.push(`${options.type}`);
                        if (options.separation) summary.push(options.separation === '필요' ? '분리필요' : '분리불필요');
                        break;
                    case 'refrigerator':
                        if (options.type) summary.push(`${options.type}`);
                        break;
                    default:
                        // 기존 옵션 표시 로직 유지
                        if (options.size) summary.push(`크기: ${options.size}`);
                        if (options.type) summary.push(`종류: ${options.type}`);
                        if (options.width) summary.push(`너비: ${options.width}`);
                        if (options.height) summary.push(`높이: ${options.height}`);
                        if (options.frame) summary.push(`프레임: ${options.frame}`);
                        if (options.assembly) summary.push(`분해: ${options.assembly === '필요' ? '필요' : '불필요'}`);
                        if (options.separation) summary.push(`분리: ${options.separation === '필요' ? '필요' : '불필요'}`);
                }
                
                summaryDisplay.style.display = 'block';
                summaryDisplay.textContent = summary.join(' | ');
            }
        }
    }

    closeModal(type);
}

// 아이템 옵션 초기화 함수 수정
function resetItemOptions(type) {
    itemOptions[type] = { quantity: 1 };
    
    const modal = document.getElementById(`${type}Modal`);
    if (modal) {
        modal.querySelectorAll('.option-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const quantityInput = modal.querySelector('.quantity-input');
        if (quantityInput) {
            quantityInput.value = 1;
        }
    }
    
    const checkbox = document.querySelector(`input[value="${getKoreanType(type)}"]`);
    if (checkbox) {
        checkbox.checked = false;
        checkbox.dataset.options = '';
        
        const card = checkbox.closest('.item-card');
        if (card) {
            card.classList.remove('selected');
            
            const quantityDisplay = card.querySelector('.item-quantity');
            if (quantityDisplay) {
                quantityDisplay.style.display = 'none';
            }
            
            const summaryDisplay = card.querySelector('.item-options-summary');
            if (summaryDisplay) {
                summaryDisplay.style.display = 'none';
                summaryDisplay.textContent = '';
            }
        }
    }
    
    closeModal(type);
}

// 아이템 선택 상태 복원
function restoreItemSelection(item) {
    const checkbox = document.querySelector(`input[value="${item.name}"]`);
    if (checkbox) {
        checkbox.checked = true;
        checkbox.dataset.options = JSON.stringify(item.options);
        
        const card = checkbox.closest('.item-card');
        if (card) {
            card.classList.add('selected');
            
            // 수량 표시 복원
            const quantityDisplay = card.querySelector('.item-quantity');
            if (quantityDisplay) {
                quantityDisplay.textContent = `${item.options.quantity || 1}개`;
                quantityDisplay.style.display = 'block';
            }
            
            // 수량 컨트롤 복원
            const quantityControls = card.querySelector('.quantity-controls');
            if (quantityControls) {
                quantityControls.style.display = 'flex';
                const input = quantityControls.querySelector('.quantity-input-small');
                if (input) {
                    input.value = item.options.quantity || 1;
                }
            }
        }
    }
}

// 박스 개수 선택 상태 복원
function restoreBoxCountSelection(boxCount) {
    const boxOption = document.querySelector(`.box-count-option[data-value="${boxCount}"]`);
    if (boxOption) {
        boxOption.classList.add('selected');
    }
}

// 수량 입력 필드 변경 처리
function handleQuantityInputChange(e) {
    const input = e.target;
    const card = input.closest('.item-card');
    let value = parseInt(input.value) || 1;
    
    // 값 범위 제한
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    
    updateQuantityDisplay(card, value);
    saveToLocalStorage();
}

// 박스 개수 선택 처리
function handleBoxCountSelection() {
    document.querySelectorAll('.box-count-option').forEach(el => {
        el.classList.remove('selected');
    });
    this.classList.add('selected');
    saveToLocalStorage();
}

// 아이템 선택/해제 토글
function toggleItemSelection(card, checkbox) {
    checkbox.checked = !checkbox.checked;
    card.classList.toggle('selected', checkbox.checked);
    
    if (checkbox.checked) {
        const options = { quantity: 1 };
        checkbox.dataset.options = JSON.stringify(options);
        updateQuantityDisplay(card, 1);
    } else {
        checkbox.dataset.options = '';
        const quantityDisplay = card.querySelector('.item-quantity');
        const quantityControls = card.querySelector('.quantity-controls');
        if (quantityDisplay) {
            quantityDisplay.textContent = '';
            quantityDisplay.style.display = 'none';
        }
        if (quantityControls) {
            quantityControls.style.display = 'none';
        }
    }
}

// 수량 표시 업데이트
function updateQuantityDisplay(card, quantity) {
    const quantityDisplay = card.querySelector('.item-quantity');
    const input = card.querySelector('.quantity-input-small');
    const checkbox = card.querySelector('input[type="checkbox"]');
    
    if (quantityDisplay) {
        quantityDisplay.textContent = `${quantity}개`;
        quantityDisplay.style.display = 'block';
    }
    if (input) {
        input.value = quantity;
    }
    if (checkbox && checkbox.dataset.options) {
        const options = JSON.parse(checkbox.dataset.options);
        options.quantity = quantity;
        checkbox.dataset.options = JSON.stringify(options);
    }
}

// 신청 유형별 결과 페이지 매핑
const RESULT_PAGES = {
    'home-moving': 'home-moving-result.html',
    'office-moving': 'office-moving-result.html',
    'small-moving': 'small-moving-result.html'
};

// 폼 제출 후 처리
function handleFormSubmission(formType) {
    // 기존의 quote-complete.html로 이동하는 부분을 수정
    const resultPage = RESULT_PAGES[formType];
    if (resultPage) {
        window.location.href = resultPage;
    } else {
        // 매핑되지 않은 경우 기본 페이지로 이동
        window.location.href = 'index.html';
    }
}

// 기존 코드에서 handleFormSubmission 함수 호출 부분 수정
form.addEventListener('submit', function(e) {
    e.preventDefault();
    // 폼 처리 로직...
    
    // 폼 타입에 따라 적절한 페이지로 이동
    handleFormSubmission(formType);
});

// 주소 검색 완료 후 처리 함수 수정
function handleAddressComplete(data, type) {
    const addressInput = document.getElementById(`${type}Address`);
    const detailInput = document.getElementById(`${type}DetailAddress`);
    const floorInput = document.querySelector(`input[name="${type}Floor"]`);
    
    if (addressInput) addressInput.value = data.address;
    if (detailInput) detailInput.focus();
    
    // 층수 입력 필드가 있는 경우 초기화
    if (floorInput) floorInput.value = '';
    
    savePageData();
}