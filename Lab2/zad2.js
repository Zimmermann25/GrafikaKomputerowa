//jak zmienił się kolor każdej ze ścian?
// wierzchołki mają przypisane kolory tak jak w tablicy vertexColor, ale na każdej ścianie jest widoczny gradient kolorów,
//kolor zmienia się w zależności od dystansu między kolejnymi parami wierzchołków
window.onload = function(){
	var gl;
	var shaderProgram;
	var uPMatrix;
	var vertexPositionBuffer;
	var vertexColorBuffer;
	function startGL() 
	{
		alert("StartGL");
		let canvas = document.getElementById("canvas3D"); //wyszukanie obiektu w strukturze strony 
		gl = canvas.getContext("experimental-webgl"); //pobranie kontekstu OpenGL'u z obiektu canvas
		gl.viewportWidth = canvas.width; //przypisanie wybranej przez nas rozdzielczości do systemu OpenGL
		gl.viewportHeight = canvas.height;
		
			//Kod shaderów
		const vertextShaderSource = ` //Znak akcentu z przycisku tyldy - na lewo od przycisku 1 na klawiaturze
			precision highp float;
			attribute vec3 aVertexPosition; 
			attribute vec3 aVertexColor;
			uniform mat4 uMVMatrix;
			uniform mat4 uPMatrix;
			varying vec3 vColor;
			void main(void) {
				gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); //Dokonanie transformacji położenia punktów z przestrzeni 3D do przestrzeni obrazu (2D)
				vColor = aVertexColor;
			}
		`;
		const fragmentShaderSource = `
			precision highp float;
			varying vec3 vColor;
			void main(void) {
				gl_FragColor = vec4(vColor,1.0); //Ustalenie stałego koloru wszystkich punktów sceny
			}
		`;
		let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); //Stworzenie obiektu shadera 
		let vertexShader   = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(fragmentShader, fragmentShaderSource); //Podpięcie źródła kodu shader
		gl.shaderSource(vertexShader, vertextShaderSource);
		gl.compileShader(fragmentShader); //Kompilacja kodu shader
		gl.compileShader(vertexShader);
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) { //Sprawdzenie ewentualnych błedów kompilacji
			alert(gl.getShaderInfoLog(fragmentShader));
			return null;
		}
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(vertexShader));
			return null;
		}
		
		shaderProgram = gl.createProgram(); //Stworzenie obiektu programu 
		gl.attachShader(shaderProgram, vertexShader); //Podpięcie obu shaderów do naszego programu wykonywanego na karcie graficznej
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) alert("Could not initialise shaders");  //Sprawdzenie ewentualnych błedów
		
		//Opis sceny 3D, położenie punktów w przestrzeni 3D w formacie X,Y,Z 
		let vertexPosition = [
		//Top
			-1.0, +1.0, -1.0,  -1.0, +1.0, +1.0,  +1.0, +1.0, +1.0, //3 punkty po 3 składowe - X1,Y1,Z1, X2,Y2,Z2, X3,Y3,Z3 - 1 trójkąt
			-1.0, +1.0, -1.0,  +1.0, +1.0, +1.0,  +1.0, +1.0, -1.0,
		//Left
			-1.0, -1.0, +1.0,  -1.0, +1.0, +1.0,  -1.0, -1.0, -1.0,
			-1.0, -1.0, -1.0,  -1.0, +1.0, +1.0,  -1.0, +1.0, -1.0,
		//Right
			+1.0, +1.0, +1.0,  +1.0, -1.0, +1.0,  +1.0, -1.0, -1.0,
			+1.0, +1.0, +1.0,  +1.0, -1.0, -1.0,  +1.0, +1.0, -1.0,
		//Front
			+1.0, -1.0, +1.0,  +1.0, +1.0, +1.0,  -1.0, -1.0, +1.0,
			-1.0, +1.0, +1.0,  -1.0, -1.0, +1.0,  +1.0, +1.0, +1.0,
		//Back
			+1.0, +1.0, -1.0,  +1.0, -1.0, -1.0,  -1.0, -1.0, -1.0,
			+1.0, +1.0, -1.0,  -1.0, -1.0, -1.0,  -1.0, +1.0, -1.0,
		//Bottom
			-1.0, -1.0, +1.0,  -1.0, -1.0, -1.0,  +1.0, -1.0, +1.0,
			+1.0, -1.0, +1.0,  -1.0, -1.0, -1.0,  +1.0, -1.0, -1.0
		]
		
		vertexPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
		vertexPositionBuffer.itemSize = 3; //zdefiniowanie liczby współrzednych per wierzchołek
		vertexPositionBuffer.numItems = 12; //Zdefinoiowanie liczby punktów w naszym buforze
		
		//Opis sceny 3D, kolor każdego z wierzchołków
		let vertexColor = [
			//Top
				1.0, 1.0, 0.0,  1.0, 0.0, 1.0,  0.0, 1.0, 1.0, //3 punkty po 3 składowe - R1,G1,B1, R2,G2,B2, R3,G3,B3 - 1 trójkąt
				1.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 1.0,
			//Left
				0.1, 0.2, 0.8,  0.1, 0.8, 0.2,  0.2, 0.1, 0.8,
				0.2, 0.8, 0.1,  0.8, 0.1, 0.2,  0.8, 0.2, 0.1,
			//Right
				0.2, 0.8, 1.5,  0.2, 1.5, 0.8,  0.8, 0.2, 1.5,
				0.8, 1.5, 0.2,  1.5, 0.2, 0.8,  1.5, 0.8, 0.2,
			//Front
				0.2, 0.8, 0.5,  0.2, 0.5, 0.8,  0.8, 0.2, 0.5,
				0.8, 2.5, 0.2,  0.5, 0.2, 0.8,  0.5, 0.8, 0.2,
			//Back
				0.1, 0.5, 1.0,  0.1, 1.0, 0.5,  0.5, 0.1, 1.0,
				0.5, 1.0, 0.1,  1.0, 0.1, 0.5,  1.0, 0.5, 0.1,
			//Bottom
				0.3, 0.5, 0.7,  0.3, 0.7, 0.5,  0.5, 0.3, 0.7,
				0.5, 0.7, 0.3,  0.7, 0.3, 0.5,  0.7, 0.5, 0.3,
			]

	vertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColor), gl.STATIC_DRAW);
		vertexColorBuffer.itemSize = 3;
		vertexColorBuffer.numItems = 12;
		
		
		//Macierze opisujące położenie wirtualnej kamery w przestrzenie 3D
		let aspect = gl.viewportWidth/gl.viewportHeight;
		let fov = 45.0 * Math.PI / 180.0; //Określenie pola widzenia kamery
		let zFar = 100.0; //Ustalenie zakresów renderowania sceny 3D (od obiektu najbliższego zNear do najdalszego zFar)
		let zNear = 0.1;
		uPMatrix = [
		1.0/(aspect*Math.tan(fov/2)),0                           ,0                         ,0                            ,
		0                         ,1.0/(Math.tan(fov/2))         ,0                         ,0                            ,
		0                         ,0                           ,-(zFar+zNear)/(zFar-zNear)  , -1,
		0                         ,0                           ,-(2*zFar*zNear)/(zFar-zNear) ,0.0,
		];
		Tick();
	} 

	function mulMatrix(inA, inB){ // ta funkcja tylko do mnożenia macierzy 4x4 zapisanych jako jednowymiarowa 1x16
		//output tez musi miec jeden wymiar
		//zakładam, ze wejdą poprawne macierze i nie sprawdzam warunku, że B == C dla poniższego 
		//(A, B) * (C,D) to (A,D) - litery to ilość wierszy i ilość kolumn
		var rows = 4;
		var cols = 4;
		var out = new Array(16).fill(0);

		for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
				var temp = 0;
         for (let k = 0; k < 4; k++) {
            temp += inA[i*4 + k] * inB[j + k*4 ];
         }
				 out[i*4 + j] = temp;
      }
			
   	}

		 return out;
	}

	// 130, by szybko się pojawił sześcian na ekranie
	let angle = 130.0; //Macierz transformacji świata - określenie położenia kamery 
	function Tick()
	{  
		angle +=3; //troszkę szybciej
		console.log(angle);
		//implementacja macierzy rotacji dla osi X i Z, przy użyciu zmiennej angle
		let RotationOZ = [
			Math.cos(angle*Math.PI/180.0),-Math.sin(angle*Math.PI/180.0),0,0, //Macierz Rotacji XY
			Math.sin(angle*Math.PI/180.0),Math.cos(angle*Math.PI/180.0),0,0,
			0,0,1,0,
			0,0,-5,1 //Położenie kamery
		]

		let RotationOY = [
			Math.cos(angle*Math.PI/180.0),0, -Math.sin(angle*Math.PI/180.0), 0, //Macierz Rotacji XZ
			0,1,0,0,
			Math.sin(angle*Math.PI/180.0),0,Math.cos(angle*Math.PI/180.0),0.0,
			0,0,-5,1 //Położenie kamery
		]

		let RotationOX = [
			1,0,0,0, //Macierz Rotacji YZ
			0,Math.cos(angle*Math.PI/180.0),-Math.sin(angle*Math.PI/180.0),0,
			0,Math.sin(angle*Math.PI/180.0),Math.cos(angle*Math.PI/180.0),0,
			0,0,-5,1 //Położenie kamery
		]
		let temp1 =  mulMatrix(RotationOX, RotationOY);
		//let uMVMatrix = temp1;
		let uMVMatrix = mulMatrix(temp1, RotationOZ);
		/*let uMVMatrix = [
		Math.cos(angle*Math.PI/180.0),-Math.sin(angle*Math.PI/180.0),0,0, //Macierz Rotacji
		Math.sin(angle*Math.PI/180.0),Math.cos(angle*Math.PI/180.0),0,0,
		0,0,1,0.0,
		0,0,-5,1 //Położenie kamery
		];*/
		
		
		//Render Scene
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
		gl.clearColor(1.0,0.0,0.0,1.0); //Wyczyszczenie obrazu kolorem czerwonym
		gl.clearDepth(1.0);             //Wyczyścienie bufora głebi najdalszym planem
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.useProgram(shaderProgram)   //Użycie przygotowanego programu shaderowego
		
		gl.enable(gl.DEPTH_TEST);           // Włączenie testu głębi - obiekty bliższe mają przykrywać obiekty dalsze
		gl.depthFunc(gl.LEQUAL);            // 
		
		gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uPMatrix"), false, new Float32Array(uPMatrix)); //Wgranie macierzy kamery do pamięci karty graficznej
		gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix"), false, new Float32Array(uMVMatrix));
		
		gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexPosition"));  //Przekazanie położenia
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexPosition"), vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexColor"));  //Przekazanie kolorów
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexColor"), vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numItems*vertexPositionBuffer.itemSize); //Faktyczne wywołanie rendrowania
		
		setTimeout(Tick,100);
	}
	startGL();

}


//dla dwuwymiarowej zadziała, ale UVMatrix jest jednowymiarowe
/*function mulMatrix(inA, inB, out){//czy out jako parametr jest niezbędny??
			//wypełnienie zerami macierzy out, żeby potem można było dodawać na zasadzie out[i][i] = a[i][k] * b[k][j]
			//rozmiar macierzy out w momencie gdy (A, B) * (C,D) to (A,D) - litery to ilość wierszy i ilość kolumn
			var inARows = inA.length;
			var inACols = inA[0].length;
			var inBRows = inB.length;
			var inBRows = inB[0].length; 
			var temp = new Array(inARows);
			if(inACols != inBRows)return []; // złe dane
			for(var i=0; i<numOfRows; i++){
				out[i] = new Array(inBcols).fill(0);
			}

			for (var i = 0; i < x; i++) {
				for (var j = 0; j < y; j++) {
					 for (var k = 0; k < z; k++) {
							out[i][j] += (inA[i][k] * inB[k][j]);
					 }
				}
		 }
		 return out;

	}*/