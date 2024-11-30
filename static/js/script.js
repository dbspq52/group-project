document.addEventListener("DOMContentLoaded", function () {
    // Mapbox Access Token 설정
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2hhcmlzbWExMSIsImEiOiJjazM1M3dra2cwZjM0M2NwZXhmdWEybHIyIn0.ALDvfHZ6cPKoika-aEL65A';

    const mapTab = document.getElementById("show-map");
    const addTab = document.getElementById("add-collision");
    const mapContent = document.getElementById("map-content");
    const addContent = document.getElementById("add-content");

    mapTab.addEventListener("click", function () {
        mapTab.classList.add("active");
        addTab.classList.remove("active");
        mapContent.classList.add("active");
        addContent.classList.remove("active");
        map.resize();
    });

    addTab.addEventListener("click", function () {
        addTab.classList.add("active");
        mapTab.classList.remove("active");
        addContent.classList.add("active");
        mapContent.classList.remove("active");
        addMap.resize();
    });

    // 지도 설정
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-118.2437, 34.0522],
        zoom: 10
    });

    var markers = [];

    function addMarkers(data) {
        data.forEach(point => {
            var el = document.createElement('div');
            el.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#ff5722" stroke-width="2" fill="#fff" />
                    <circle cx="12" cy="12" r="6" fill="#ff5722" />
                </svg>
            `;
            el.style.cursor = 'pointer';
    
            // 팝업 생성
            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<strong>DR Number:</strong> ${point['DR Number']}`);
    
            // 마커 추가
            var marker = new mapboxgl.Marker(el)
                .setLngLat([point.longitude, point.latitude])
                .addTo(map);
    
            // 마우스 이벤트 추가
            el.addEventListener('mouseover', () => {
                popup.setLngLat([point.longitude, point.latitude]).addTo(map);
            });
    
            el.addEventListener('mouseout', () => {
                popup.remove();
            });
    
            // 클릭 이벤트 추가 - Flask 서버로 데이터 전송
            el.addEventListener('click', () => {
                fetch('/about_accident', {
                    method: 'GET', // POST가 일반적이지만, GET으로 바꿀 수도 있습니다.
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        dr_number: point['DR Number'],
                        latitude: point.latitude,
                        longitude: point.longitude
                    }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Response from server:', data);
                
                        if (data.url) {
                            // 서버에서 URL을 받은 경우 해당 URL로 이동
                            window.location.href = data.url;
                        } else {
                            console.error('No URL received from server');
                        }
                    })
                    .catch(error => {
                        console.error('Error sending data to server:', error);
                    });
            });
    
            markers.push(marker);
        });
    }
    

    // 기존 마커 제거 함수
    function clearMarkers() {
        markers.forEach(marker => marker.remove());
        markers = [];
    }


    // D3.js로 그래프 생성
    const plotElement = document.getElementById('plot');
    if (plotElement && typeof graphData !== 'undefined') {
        const data = graphData.months.map((month, index) => ({
            month: month,
            count: graphData.counts[index]
        }));

        const svg = d3.select("#plot");
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d.month))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .nice()
            .range([height, 0]);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => `Month ${d}`));

        g.append("g")
            .call(d3.axisLeft(y).ticks(5));

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.month))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.count))
            .attr("fill", "steelblue");

        // 막대 클릭 이벤트
        d3.selectAll(".bar").on("click", function (event, d) {
            console.log(`Fetching data for month: ${d.month}`);
            fetch(`/get_data_by_month/${d.month}`)
                .then(response => response.json())
                .then(data => {
                    clearMarkers();
                    addMarkers(data);
                })
                .catch(error => console.error("Error fetching data by month:", error));
        });
    }
    // 데이터 초기화 버튼
    document.getElementById('showAll').addEventListener('click', function () {
        fetch('/get_data')
            .then(response => response.json())
            .then(data => {
                clearMarkers();
                addMarkers(data);
            });
    });
    document.getElementById('reset').addEventListener('click', function () {
        clearMarkers();    
    });
    // 슬라이더로 날짜 필터링
    const dateSlider = document.getElementById('date-slider');
    const selectedDateRangeLabel = document.getElementById('selected-date-range');

    dateSlider.addEventListener('input', function () {
        const startDate = new Date(2012, 2, 1);
        const selectedDate = new Date(startDate);
        selectedDate.setDate(startDate.getDate() + parseInt(dateSlider.value));

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        selectedDateRangeLabel.textContent = `Selected Date: ${formattedDate}`;

        fetch(`/get_data_by_date/${formattedDate}`)
            .then(response => response.json())
            .then(data => {
                clearMarkers();
                addMarkers(data);
            })
            .catch(error => {
                console.error("Error fetching filtered data:", error);
            });
    });

    // 지도에 새 충돌 예측 지점 추가
    var addMap = new mapboxgl.Map({
        container: 'add-map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-118.2437, 34.0522],
        zoom: 10
    });

    var predictionMarker = null;

    addMap.on('click', function (e) {
        var latitude = e.lngLat.lat;
        var longitude = e.lngLat.lng;

        if (predictionMarker) {
            predictionMarker.remove();
        }

        var el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.backgroundColor = '#00ff00';
        el.style.borderRadius = '50%';

        predictionMarker = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setText('New Prediction Point'))
            .addTo(addMap);

        fetch('/save_collision', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },

            body: `latitude=${latitude}&longitude=${longitude}&dr_number=New Prediction`
        })
            .then(response => response.text())
            .then(data => {
                document.getElementById('add-result').innerText = data;
            })
            .catch(error => {
                console.error('Error adding collision:', error);
            });
    });
});
