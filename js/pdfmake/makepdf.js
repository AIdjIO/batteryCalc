async function makepdf(){

	let getById = document.getElementById;

	pdfMake.fonts = {
		// Courier: {
		//   normal: 'Courier',
		//   bold: 'Courier-Bold',
		//   italics: 'Courier-Oblique',
		//   bolditalics: 'Courier-BoldOblique'
		// },
		Helvetica: {
		  normal: 'Helvetica.ttf',
		  bold: 'Helvetica-Bold.ttf',
		  italics: 'Helvetica-Oblique.ttf',
		  bolditalics: 'Helvetica-BoldOblique.ttf'
			},
		Roboto: {
			normal: 'Roboto-Regular.ttf',
			bold: 'Roboto-Medium.ttf',
			italics: 'Roboto-Italic.ttf',
			bolditalics: 'Roboto-MediumItalic.ttf'
		  },
		// Times: {
		//   normal: 'Times-Roman',
		//   bold: 'Times-Bold',
		//   italics: 'Times-Italic',
		//   bolditalics: 'Times-BoldItalic'
		// },
		// Symbol: {
		//   normal: 'Symbol'
		// },
		// ZapfDingbats: {
		//   normal: 'ZapfDingbats'
		// }
	  };
	
	let version = document.getElementById('calcVersion').innerHTML;
	let title = document.getElementById('edit-batt-title').value;
	let cellTable = document.getElementById('cell_table');	

	let vehicleParam = {
		mass : document.getElementById('edit-vehicle-mass'),
		frtArea: document.getElementById('edit-frontal-area'),
		tireSize: document.getElementById('edit-wheel-radius'),
		rollResistance: document.getElementById('edit-rolling-resistance'),
		aeroDrag: document.getElementById('edit-drag-coefficient'),
	}
	let requirements = {
		range: document.getElementById('edit-vehicle-range'),
	}
	let assumptions = {
		useableCapacity: document.getElementById('edit-useable-capacity'),
		regenBraking: document.getElementById('edit-regen-capacity'),
		powertrainEff: document.getElementById('edit-powertrain-efficiency'),
		ancillaryLoad: document.getElementById('edit-ancillary-energy'),
		testCycle: document.getElementById('edit-cycle-select'),
	}
	let drivetrainParams = {
		diffRatio : document.getElementById('edit-drive-ratio-differential'),
		driveRatio: document.getElementById('edit-drive-ratio-gear'),
	}
	let driveType = [...document.getElementsByName('Drive_Type')].filter(ele=>ele.checked)[0];

	let motorLabels = [...document.getElementById('motor-container').querySelectorAll('label')]
	let motorValues = [...document.getElementById('motor-container').querySelectorAll('label')].map(ele=>ele.nextElementSibling)
	
	let environment = {
		airDensity : document.getElementById('edit-air-density'),
		roadSlope : document.getElementById('edit-road-slope')
	}
	let results = {
		cycleInfo: document.getElementById('speed_info'),
		vehicleResults: document.getElementById('results'),
		packResults: document.getElementById('packParameters'),
	}
		
	let plotContainers = [
		document.getElementById("speedPlotPreview"),
		document.getElementById("speedPlotPackSize"),
		document.getElementById("speedPlotPackSpec"),
	];

	//cell data from selected table row
	let cellData = [
		[...[...cellTable.querySelectorAll('th')].filter((x,idx)=>idx!=0).map(x=>x.innerText.toUpperCase())],
		[...[...cellTable.querySelectorAll('input[type=radio]:checked')[0].closest("tr").querySelectorAll('td')].filter((x,idx)=>idx!=0).map(el=>el.innerHTML)] //get values from selected tr
	];
	// transpose cellData table to fit into the document
	let [cellDataColumn] = cellData;
	let cellDataRow = cellDataColumn.map((value, column) => cellData.map(row => row[column]));
	
	let qrContent = `${title}\nTest Cycle: ${assumptions.testCycle.options[assumptions.testCycle.options.selectedIndex].text}\n
					Average road slope  + ${environment.roadSlope.value}° and air density of ${environment.airDensity.value}kg/m3\n
					Required ${requirements.range.previousElementSibling.innerHTML}: ${requirements.range.value}\n
					Battery Pack Spec: ${results.packResults.innerText.replace(/\s(Battery Pack Specification)\s/, '')}\n
					Selected Cell: ${(JSON.stringify(cellDataRow)).replace(/[\"\[\]]+/gm,'').replace}`;

	let content = [];

	content.push(
		{ text: title, style: 'coverTitle', absolutePosition: { x: 20, y: 150 } },
		{ text: 'Preliminary Battery Sizing Calculations Report for Vehicle Application', style: 'coverSubTitle', absolutePosition: { x: 20, y: 275 }, },
		{ qr: qrContent, foreground: 'black', background: 'white', fit:'350',absolutePosition: {x:140,y:500}, pageBreak: 'after'}
	);
	content.push({
		toc: {
		  title: {text: 'Table of Contents', style: 'header'}
		}, 
		pageBreak: 'after'
	  },
	);
	content.push({
		text: 'Vehicle Test Cycle',
		style: 'header',
		tocItem: true,
	  },{ text: ['All values are assumed on the following test cycle:\n',
	  			{ text: assumptions.testCycle.options[assumptions.testCycle.options.selectedIndex].text + '\n', italics:true },
				{  text: 'Average road slope ' + environment.roadSlope.value + '° and air density of ' + environment.airDensity.value  +  'kg/m3\n' }
			], bold: true },
		);
	
	// include plot of speed cycle.
	await Plotly.toImage(plotContainers[0], {format: 'svg'}).then( d => {
		content.push({
			svg : decodeURIComponent(d).replace('data:image/svg+xml,',''),
			alignment:'center', 
			width: 500,})
		});
	content.push({ text: results.cycleInfo.innerText.replace(/\n\s+/gm,''), italics:true },
		{ text: '\n' },
	);
	content.push({ text: 'Vehicle Target', style: 'header', tocItem: true, },
				{ text: 'Required ' + requirements.range.previousElementSibling.innerHTML + ' :' + requirements.range.value },
				{ text: '\n' },
);					
	content.push(
		{
		text: 'Assumed Vehicle Specification',
		style: 'header',
		tocItem: true,
		},
		{
		text: 'Vehicle Parameters: ', decoration: 'underline', bold:true},
		{
		table: {
			headerows: 1,
			body: [
				[ ...Object.keys(vehicleParam).map(key=>vehicleParam[key].previousElementSibling.innerHTML)],
				[ ...Object.keys(vehicleParam).map(key=>key!='tireSize'?vehicleParam[key].value:vehicleParam[key].options[vehicleParam[key].options.selectedIndex].text)]
			]
		}
		},
		{text: '\n'},
		{
		text: 'Drivetrain Parameters: ', decoration: 'underline', bold:true},
		{
		table: {
			headerows: 1,
			body: [
				[ driveType.parentElement.parentElement.parentElement.previousElementSibling.firstElementChild.innerHTML, ...Object.keys(drivetrainParams).map(key=>drivetrainParams[key].previousSibling.previousSibling.innerHTML)],
				[ driveType.nextElementSibling.innerHTML, ...Object.keys(drivetrainParams).map(key=>drivetrainParams[key].value)]
			]
		}
		},
		{text: '\n'},
		{
		text: 'Motor Specifications: ', decoration: 'underline', bold:true},
		{
		table: {
			headerows: 1,
			body: [
				[ driveType.parentElement.parentElement.parentElement.previousElementSibling.firstElementChild.innerHTML, ...motorLabels.map(ele=>ele.textContent)],
				[ driveType.nextElementSibling.innerHTML, ...motorValues.map(ele=>ele.value)]
			]
		}
		},
		{text: '', pageBreak: 'after'},
	);

	content.push(
		{
		text: 'Vehicle Power and Energy',
		style: 'header',
		tocItem: true,
		},
	)
	// include plot of vehicle power and energy
	await Plotly.toImage(plotContainers[1], {format: 'svg'}).then( d => {
		content.push({
			svg : decodeURIComponent(d).replace('data:image/svg+xml,',''),
			alignment:'center', 
			width: 500, })
		});

	content.push({ text: results.vehicleResults.innerText.replace(/\n\s+/gm,''), italics:true },
		{ text: '\n', pageBreak: 'after' },
	);

	content.push(
		{
		text: 'Vehicle Battery Pack SOC, Current',
		style: 'header',
		tocItem: true,
		},
	)
	// include plot of vehicle power and energy
	await Plotly.toImage(plotContainers[2], {format: 'svg'}).then( d => {
		content.push({
			svg : decodeURIComponent(d).replace('data:image/svg+xml,',''),
			alignment:'center', 
			width: 500, pageBreak: 'after'})
		});
	content.push(
		{
		text: 'Vehicle Battery Pack Specification',
		style: 'header',
		tocItem: true,
		},
	)
	content.push({ text: results.packResults.innerText.replace(/\s(Battery Pack Specification)\s/, ''), italics:true },
		{ text: '\n' },
	);

	content.push(
		{
		text: 'Selected Cell Specification',
		style: 'header',
		tocItem: true,
		},	
		{
			table: {
				headerows: 1,
				body: cellDataRow,
			}
		}
	)
	
		
	let dd = {
		defaultStyle: {
			fontSize:12,
			// font: 'Helvetica',
		},
		background: function(currentPage, pageSize) {
			return currentPage == 1 ? 
			{ image: b64images.batteryPack, pageBreak: 'after', width: 500,	absolutePosition: { x: 50, y: 197 }, opacity: 0.5}:
			{}
		  },
		pageSize : 'A4',
		pageOrientation : 'portrait',
		pageMargins : [50, 100, 50, 20],
		header: function(currentPage, pageCount, pageSize) {
			if ( currentPage!=1 ){
			return [
					{columns : [
					{ image: b64images.logo, width: 150, absolutePosition: {x:1, y:1} },
					{ text: 'Calculator: ' + version, absolutePosition: {x:250, y:1} },
					{ qr: qrContent, foreground: 'black', background: 'white', fit:'75',absolutePosition: {x:531,y:1}},
					],}
			]}
		},
		footer: function(currentPage, pageCount) { 
			return (currentPage == 1)?
				{text: 'Report generated on ' + new Date().toLocaleDateString('en-uk', { weekday:"long", year:"numeric", month:"short", day:"numeric"}), margin: [72,40] } :
				{text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', margin: [72,40]}
			},
		// pageBreakBefore: function(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
		// 	return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
		//  },
		content: content,
		styles: {
			coverTitle:{
				fontSize: 40,
				alignment: 'center',
				color: '#135898',
				font:'Roboto',
				bold: true,
			},
			coverSubTitle:{
				fontSize: 35,
				alignment: 'center',
				color: 'black', //'#23A638',
				bold: true
				// font: 'Helvetica',
			},
			header: {
				fontSize: 18,
				bold: true
			},
			subheader: {
				fontSize: 15,
				bold: true
			},
			quote: {
				italics: true
			},
			small: {
				fontSize: 8
			}
		}	
	}

	console.log("download");
	let pdf = pdfMake.createPdf(dd).open();
}

async function getBase64Image(selector='.main-svg') {
    return new Promise((resolve, reject) => {
         const img = new Image();
         const svgElement =
         document.querySelector(selector);
         const imageBlobURL = 'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent(svgElement.outerHTML);
         img.onload = ()=> {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
         };
         img.onerror = (error) => {
           reject(error);
         };
         img.src = imageBlobURL;
       });
  }