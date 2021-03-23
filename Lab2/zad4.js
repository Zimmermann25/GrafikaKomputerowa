//jak zmienił się kolor każdej ze ścian?
// wierzchołki mają przypisane kolory tak jak w tablicy vertexColor, ale na każdej ścianie jest widoczny gradient kolorów,
//kolor zmienia się w zależności od dystansu między kolejnymi parami wierzchołków
//obroty nie działają
window.onload = function(){
	var gl;
	var shaderProgram;
	var uPMatrix;
	var vertexPositionBuffer;
	var vertexColorBuffer;

	function MatrixMul(a,b) //Mnożenie macierzy
	{
		c = [
		0,0,0,0,
		0,0,0,0,
		0,0,0,0,
		0,0,0,0
		]
		for(let i=0;i<4;i++)
		{
			for(let j=0;j<4;j++)
			{
				c[i*4+j] = 0.0;
				for(let k=0;k<4;k++)
				{
					c[i*4+j]+= a[i*4+k] * b[k*4+j];
				}
			}
		}
		return c;
	}

	function startGL() 
	{
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
			//bottom
				-1,0,2,     0,0,2,      0,0,5,
				-1,0,2,			-1,0,5,			0,0,5,
			
				//prawa sciana
				0,0,2,			0,0,5,			0,1,5,
				0,0,2,			0,1,2,			0,1,5,
	
				//lewa sciana
				-1,0,2,			-1,0,5,			-1,1,5,
				-1,0,2,			-1,1,2,			-1,1,5,
	
				//odnoga w lewo i prawo
				//bottom
				3,0,2,			-3,0,2,			3,0,1,
				-3,0,2,			-3,0,1,			3,0,1,		
				//sciana po lewej stronie po skręcie w lewo
				-3,0,2,			-1,0,2,			-1,1,2,
				-3,0,2,			-3,1,2,			-1,1,2,
	
				//sciana po prawej po skręcie w prawo
				0,0,2,			2,0,2,			2,1,2,
				0,0,2,			0,1,2,			2,1,2,
	
				//sciana na wprost
				-2,0,1,		3,0,1,			3,1,1,
				-2,0,1,		-2,1,1,			3,1,1,	
	
				//zejście w prawo do ślepego zaułka
				//sciana na wprost
				3,0,1,			3,0,4,			3,1,4,
				3,0,1,			3,1,1,			3,1,4,
				
				//po wejściu do ślepego zaułka ściana na wprost
				2,0,4,			3,0,4,			3,1,4,
				2,0,4,			2,1,4,			3,1,4,
	
				//po wejsciu do zaułka, ściana po prawej
				2,0,2,			2,0,4,			2,1,4,
				2,0,2,			2,1,2,			2,1,4,
				
				//podłoga slepego zaułka
				2,0,2,			2,0,4,			3,0,4,
				2,0,2,			3,0,2,			3,0,4,		
	
				//lewa sciana(blokada)
				-3,0,2,			-3,0,0,			-3,1,0,
				-3,0,2,			-3,1,2,			-3,1,0,
	
				//podłoga
				-3,0,1,		-3,0,-2,		-2,0,-2,
				-3,0,1,		-2,0,1,		-2,0,-2,
	
				//sciana po prawej poprawnej
				-2,0,1,			-2,0,-1,			-2,1,1,
				-2,0,-1,		-2,1,-1,		-2,1,1,
	
				//sciana na wprost poprawnej(długa po lewej)
				-3,0,-2,		1,0,-2,			1,1,-2,
				-3,0,-2,		-3,1,-2,		1,1,-2,	
	
				//sciana poprawnej do wyjscia
				1,0,-2,			1,0,-4,			1,1,-2,
				1,1,-4,			1,0,-4,			1,1,-2,
	
				//wyjście ściana po lewej
				-1,0,-4,		1,0,-4,			1,1,-4,
				-1,0,-4,		-1,1,-4,		1,1,-4,
				
				//ostatnia sciana po lewej do wyjścia(do poprawy zaraz)
				-1,0,-4,		-1,0,-5,		-1,1,-4,
				-1,0,-5,		-1,1,-5,		-1,1,-4,
	
				//podłoga pozioma długa
				-2,0,-1,		4,0,-1,			4,0,-2,
				-2,0,-1,		-2,0,-2,		4,0,-2,	
	
				//podłoga poprawna
				1,0,-2,			1,0,-5,			2,0,-2,
				1,0,-5,			2,0,-5,			2,0,-2,
	
				//podłoga do wyjscia ostatnia
				-1,0,-4,		1,0,-4,			1,0,-5,
				-1,0,-4,		-1,0,-5,		1,0,-5,
	
				//sciany do wyjscia poprawnego
				//długo pozioma
				-2,0,-1,		3,0,-1,			3,1,-1,
				-2,0,-1,		-2,1,-1,		3,1,-1,
				
				2,0,-2,			3,0,-2,			3,1,-2, // wyjsciowe teraz
				2,0,-2,			2,1,-2,			3,1,-2,
	
				2,0,-2,			2,0,-5,			2,1,-2,
				2,0,-5,			2,1,-5,			2,1,-2,	
				
				0,0,-5,			2,0,-5,			2,1,-5,
				0,0,-5,			0,1,-5,			2,1,-5,
	
				//wyjscie
				-1, 0,-5,		0,0,-5,			0,1,-5,
				-1,0,-5,		-1,1,-5,		0,1,-5,
	
				//prawy zaułek nr 2
				//podłoga
				3,0,0,			3,0,-4,			4,0,0,
				3,0,-4,			4,0,-4,			4,0,0,
	
				3,0,-4,			3,0,-2,			3,1,-2,
				3,0,-4,			3,1,-4,			3,1,-2, // ściany
	
				3,0,-4,			4,0,-4,			4,1,-4,
				3,0,-4,			3,1,-4,			4,1,-4,
	
				4,0,-4,			4,0,0,			4,1,0,
				4,0,-4,			4,1,-4,			4,1,0,
				
				3,0,0,			4,0,0,			4,1,0, //
				3,0,0,			3,1,0,			4,1,0,
	
				3,0,-1,			3,0,0,			3,1,0,
				3,0,-1,			3,1,-1,			3,1,0,
	
				//zaułek lewy
				//podloga
				-4,0,0,			-3,0,0,			-3,0,-1,
				-4,0,0,			-4,0,-1,		-3,0,-1,
	
				-5,0,-4,		-5,0,3,			-4,0,3,
				-5,0,-4,		-4,0,-4,		-4,0,3,	
	
				-4,0,0,			-3,0,0,			-3,1,0,
				-4,0,0,			-4,1,0,			-3,1,0,
				
				-4,0,0,			-4,0,3,			-4,1,3,
				-4,0,0,			-4,1,0,			-4,1,3,
	
				-5,0,3,			-4,0,3,			-4,1,3,
				-5,0,3,			-5,1,3,			-4,1,3,
	
				-5,0,-4,		-5,0,3,			-5,1,3,
				-5,0,-4,		-5,1,-4,		-5,1,3,
	
				-5,0,-4,		-4,0,-4,		-4,1,-4,
				-5,0,-4,		-5,1,-4,		-4,1,-4,
	
				-4,0,-4,		-4,0,-1,		-4,1,-1,
				-4,0,-4,		-4,1,-4,		-4,1,-1,
	
				-4,0,-1,		-3,0,-1,		-3,1,-1,
				-4,0,-1,		-4,1,-1,		-3,1,-1,
	
				-3,0,-2,		-3,0,-1,		-3,1,-1,
				-3,0,-2,		-3,1,-2,		-3,1,-1,
	
				
			]
		
		vertexPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
		vertexPositionBuffer.itemSize = 3; //zdefiniowanie liczby współrzednych per wierzchołek
		vertexPositionBuffer.numItems = 84; //Zdefinoiowanie liczby punktów w naszym buforze
		
		//Opis sceny 3D, kolor każdego z wierzchołków
		let vertexColor = [
		//Top
			1.0, 0.2, 0.4,  1.0, 0.3, 0.3,  1.0, 0.3, 0.3, //3 punkty po 3 składowe - R1,G1,B1, R2,G2,B2, R3,G3,B3 - 1 trójkąt
			1.0, 0.2, 0.4,  1.0, 0.3, 0.3,  1.0, 0.3, 0.3,
		//Left
			0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
			0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
		//Right
			0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
			0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
		//Front
			1.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 0.0,
			1.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 0.0,
		//Back
			1.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 1.0,
			1.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 1.0,
		//Bottom
			0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0,
			0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			1,1,1,			1,1,1,			1,1,1, // podłoga zaułka
			1,1,1,			1,1,1,			1,1,1,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			1,1,1,			1,1,1,			1,1,1, // podłoga poprawnej
			1,1,1,			1,1,1,			1,1,1,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			1,1,1,			1,1,1,			1,1,1, // podłoga pozioma długa
			1,1,1,			1,1,1,			1,1,1,

			1,1,1,			1,1,1,			1,1,1, // podłoga poprawna
			1,1,1,			1,1,1,			1,1,1,

			1,1,1,			1,1,1,			1,1,1, // podłoga poprawna
			1,1,1,			1,1,1,			1,1,1,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,1,0,			0,1,0,			0,1,0, // wyjscie zielone
			0,1,0,			0,1,0,			0,1,0,

			
			1,1,1,			1,1,1,			1,1,1, // podłoga zaułek 2 prawy
			1,1,1,			1,1,1,			1,1,1,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0, // zaułek 2 prawy

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			

			1,1,1,			1,1,1,			1,1,1, // podłoga zaułek lewy
			1,1,1,			1,1,1,			1,1,1,

			1,1,1,			1,1,1,			1,1,1, // podłoga zaułek lewy
			1,1,1,			1,1,1,			1,1,1,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,

			0,0,0,			0,0,0,			0,0,0,
			0,0,0,			0,0,0,			0,0,0,
			

			//podłoga biała, ściany czarne
			//floor: 1,1,1,			1,1,1,			1,1,1,
			//walls 0,0,0,			0,0,0,			0,0,0,
		]
		vertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColor), gl.STATIC_DRAW);
		vertexColorBuffer.itemSize = 3;
		vertexColorBuffer.numItems = 12;
		
		
		//Macierze opisujące położenie wirtualnej kamery w przestrzenie 3D
		let aspect = gl.viewportWidth/gl.viewportHeight;
		let fov = 140.0 * Math.PI / 180.0; //Określenie pola widzenia kamery
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
	//let angle = 45.0; //Macierz transformacji świata - określenie położenia kamery

	var angleZ = 0.0;
	var angleY = 0.0;
	var angleX = 0.0;
	var tz = -3.3;//-3.3
	var tx = 0.6;
	var ty = -0.3;
	function Tick()
	{  
		let uMVMatrix = [
		1,0,0,0, //Macierz jednostkowa
		0,1,0,0,
		0,0,1,0,
		0,0,0,1
		];
		
		let uMVRotZ = [
		+Math.cos(angleZ*Math.PI/180.0),+Math.sin(angleZ*Math.PI/180.0),0,0,
		-Math.sin(angleZ*Math.PI/180.0),+Math.cos(angleZ*Math.PI/180.0),0,0,
		0,0,1,0,
		0,0,0,1
		];
		
		let uMVRotY = [
		+Math.cos(angleY*Math.PI/180.0),0,-Math.sin(angleY*Math.PI/180.0),0,
		0,1,0,0,
		+Math.sin(angleY*Math.PI/180.0),0,+Math.cos(angleY*Math.PI/180.0),0,
		0,0,0,1
		];
		
		let uMVRotX = [
		1,0,0,0,
		0,+Math.cos(angleX*Math.PI/180.0),+Math.sin(angleX*Math.PI/180.0),0,
		0,-Math.sin(angleX*Math.PI/180.0),+Math.cos(angleX*Math.PI/180.0),0,
		0,0,0,1
		];
		
		let uMVTranslateZ = [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,tz,1 //pozycja kamery z
		];

		let uMVTranslateY = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,ty,0,1 //pozycja kamery y
			];

		let uMVTranslateX = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			tx,0,0,1 //pozycja kamery x
			]; 


			
			

		uMVMatrix = MatrixMul(uMVMatrix,uMVRotX);
		uMVMatrix = MatrixMul(uMVMatrix,uMVRotY);
		uMVMatrix = MatrixMul(uMVMatrix,uMVRotZ);
		uMVMatrix = MatrixMul(uMVMatrix,uMVTranslateX);
			uMVMatrix = MatrixMul(uMVMatrix,uMVTranslateY);
			uMVMatrix = MatrixMul(uMVMatrix,uMVTranslateZ);
		
		
		
		//alert(uPMatrix);
		
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
	
	function handlekeydown(e)
	{
		console.log("keydown");
	if(e.keyCode==87) angleX=angleX+1.0; //W
	if(e.keyCode==83) angleX=angleX-1.0; //S
	if(e.keyCode==68){
		angleY=angleY+1.0;	//D
		//tx -= 2*Math.PI/180;
		//tz -= 0.1*Math.PI/180;
	} 
	if(e.keyCode==65) angleY=angleY-1.0; // A
	if(e.keyCode==81) angleZ=angleZ+1.0;
	if(e.keyCode==69) angleZ=angleZ-1.0;
	if(e.keyCode==73) tz +=0.3; // I
	if(e.keyCode==74) tx +=0.3; // J
	if(e.keyCode==75) tz -=0.3; // K
	if(e.keyCode==76) tx -=0.3; // L
	if(e.keyCode==85) ty -=0.3; // U
	if(e.keyCode==79) ty +=0.3; // O
	
	console.log("tx: ", tx, "ty: ", ty, "tz: ", tz, "anX: ", angleX, "angY: ", angleY, "angZ: ", angleZ);
	}

	
	startGL();
	document.addEventListener('keydown', handlekeydown);
}




let vertexPosition = [
	//bottom
		-1,0,0,     0,0,0,      0,0,3,
		-1,0,0,			-1,0,3,			0,0,3,
	
		//prawa sciana
		0,0,0,			0,0,3,			0,1,3,
		0,0,0,			0,1,0,			0,1,3,

		//lewa sciana
		-1,0,0,			-1,0,3,			-1,1,3,
		-1,0,0,			-1,1,0,			-1,1,3,

		//odnoga w lewo i prawo
		//bottom
		3,0,0,			-3,0,0,			3,0,-1,
		-3,0,0,			-3,0,-1,		3,0,-1,		
		//sciana po lewej stronie po skręcie w lewo
		-3,0,0,			-1,0,0,			-1,1,0,
		-3,0,0,			-3,1,0,			-1,1,0,

		//sciana po prawej po skręcie w prawo
		0,0,0,			2,0,0,			2,1,0,
		0,0,0,			0,1,0,			2,1,0,

		//sciana na wprost
		-2,0,-1,		3,0,-1,			3,1,-1,
		-2,0,-1,		-2,1,-1,		3,1,-1,	

		//zejście w prawo do ślepego zaułka
		//sciana na wprost
		3,0,-1,			3,0,2,			3,1,2,
		3,0,-1,			3,1,-1,			3,1,2,
		
		//po wejściu do ślepego zaułka ściana na wprost
		2,0,2,			3,0,2,			3,1,2,
		2,0,2,			2,1,2,			3,1,2,

		//po wejsciu do zaułka, ściana po prawej
		2,0,0,			2,0,2,			2,1,2,
		2,0,0,			2,1,0,			2,1,2,
		
		//podłoga slepego zaułka
		2,0,0,			2,0,2,			3,0,2,
		2,0,0,			3,0,0,			3,0,2,		

		//lewa sciana(blokada)
		-3,0,0,			-3,0,-2,		-3,1,-2,
		-3,0,0,			-3,1,0,			-3,1,-2,

		//podłoga
		-3,0,-1,		-3,0,-4,		-2,0,-4,
		-3,0,-1,		-2,0,-1,		-2,0,-4,

		//sciana po prawej poprawnej
		-2,0,-1,		-2,0,-3,		-2,1,-1,
		-2,0,-3,		-2,1,-3,		-2,1,-1,

		//sciana na wprost poprawnej(długa po lewej)
		-3,0,-4,		1,0,-4,			1,1,-4,
		-3,0,-4,		-3,1,-4,		1,1,-4,	

		//sciana poprawnej do wyjscia
		1,0,-4,			1,0,-6,			1,1,-4,
		1,1,-6,			1,0,-6,			1,1,-4,

		//wyjście ściana po lewej
		-1,0,-6,		1,0,-6,			1,1,-6,
		-1,0,-6,		-1,1,-6,		1,1,-6,
		
		//ostatnia sciana po lewej do wyjścia(do poprawy zaraz)
		-1,0,-6,		-1,0,-7,		-1,1,-6,
		-1,0,-7,		-1,1,-7,		-1,1,-6,

		//podłoga pozioma długa
		-2,0,-3,		4,0,-3,			4,0,-4,
		-2,0,-3,		-2,0,-4,		4,0,-4,	

		//podłoga poprawna
		1,0,-4,			1,0,-7,			2,0,-4,
		1,0,-7,			2,0,-7,			2,0,-4,

		//podłoga do wyjscia ostatnia
		-1,0,-6,		1,0,-6,			1,0,-7,
		-1,0,-6,		-1,0,-7,		1,0,-7,

		//sciany do wyjscia poprawnego
		//długo pozioma
		-2,0,-3,		3,0,-3,			3,1,-3,
		-2,0,-3,		-2,1,-3,		3,1,-3,
		
		2,0,-4,			3,0,-4,			3,1,-4, // wyjsciowe teraz
		2,0,-4,			2,1,-4,			3,1,-4,

		2,0,-4,			2,0,-7,			2,1,-4,
		2,0,-7,			2,1,-7,			2,1,-4,	
		
		0,0,-7,			2,0,-7,			2,1,-7,
		0,0,-7,			0,1,-7,			2,1,-7,

		//wyjscie
		-1, 0,-7,		0,0,-7,			0,1,-7,
		-1,0,-7,		-1,1,-7,		0,1,-7,

		//prawy zaułek nr 2
		//podłoga
		3,0,-2,			3,0,-6,			4,0,-2,
		3,0,-6,			4,0,-6,			4,0,-2,

		3,0,-6,			3,0,-4,			3,1,-4,
		3,0,-6,			3,1,-6,			3,1,-4, // ściany

		3,0,-6,			4,0,-6,			4,1,-6,
		3,0,-6,			3,1,-6,			4,1,-6,

		4,0,-6,			4,0,-2,			4,1,-2,
		4,0,-6,			4,1,-6,			4,1,-2,
		
		3,0,-2,			4,0,-2,			4,1,-2,
		3,0,-2,			3,1,-2,			4,1,-2,

		3,0,-3,			3,0,-2,			3,1,-2,
		3,0,-3,			3,1,-3,			3,1,-2,

		//zaułek lewy
		//podloga
		-4,0,-2,		-3,0,-2,		-3,0,-3,
		-4,0,-2,		-4,0,-3,		-3,0,-3,

		-5,0,-6,		-5,0,1,			-4,0,1,
		-5,0,-6,		-4,0,-6,		-4,0,1,	

		-4,0,-2,		-3,0,-2,		-3,1,-2,
		-4,0,-2,		-4,1,-2,		-3,1,-2,
		
		-4,0,-2,		-4,0,1,			-4,1,1,
		-4,0,-2,		-4,1,-2,		-4,1,1,

		-5,0,1,			-4,0,1,			-4,1,1,
		-5,0,1,			-5,1,1,			-4,1,1,

		-5,0,-6,		-5,0,1,			-5,1,1,
		-5,0,-6,		-5,1,-6,		-5,1,1,

		-5,0,-6,		-4,0,-6,		-4,1,-6,
		-5,0,-6,		-5,1,-6,		-4,1,-6,

		-4,0,-6,		-4,0,-3,		-4,1,-3,
		-4,0,-6,		-4,1,-6,		-4,1,-3,

		-4,0,-3,		-3,0,-3,		-3,1,-3,
		-4,0,-3,		-4,1,-3,		-3,1,-3,

		-3,0,-4,		-3,0,-3,		-3,1,-3,
		-3,0,-4,		-3,1,-4,		-3,1,-3,

		
	]