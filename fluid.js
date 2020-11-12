
window.addEventListener('DOMContentLoaded', (event) => {
    
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 100)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            // interact with the fluid
            fluid.addDensity(Math.round(TIP_engine.x) , Math.round(TIP_engine.y), (Math.random() * 100000) + 50)
            fluid.addVelocity(Math.round(TIP_engine.x) , Math.round(TIP_engine.y), Math.random()-.5, Math.random()-.5)
            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointerup', e => {
            window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine        
            // interact with the fluid
             fluid.addDensity(Math.round(TIP_engine.x) , Math.round(TIP_engine.y), (Math.random() * 100000) + 50)
            fluid.addVelocity(Math.round(TIP_engine.x) , Math.round(TIP_engine.y), Math.random()-.5, Math.random()-.5)
        }
    }
    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 

    function arrayExtend(arr) {
        for (let t = 0; t < canvas.width * canvas.width; t++) {
            // arr.push(Math.random())
            arr.push(0)
        }
        return arr
    }

    class Fluid {
        constructor(dt, diffusion, viscosity) {
            this.dt = 0
            this.diff = 0
            this.visc = 0

            this.s = arrayExtend([])
            this.density = arrayExtend([])

            this.vx = arrayExtend([])
            this.vy = arrayExtend([])
            this.vx0 = arrayExtend([])
            this.vy0 = arrayExtend([])
            this.create(dt, diffusion, viscosity)
        }
        create(dt, diffusion, viscosity) {
            this.size = canvas.width
            this.dt = dt
            this.diff = diffusion
            this.visc = viscosity

        }
        renderD() {
            for (let i = 0; i < canvas.width; i++) {
                for (let j = 0; j < canvas.width; j++) {
                    let den = this.density[(indexer(i, j))]
                    canvas_context.fillStyle = `rgba(${this.vx[(indexer(i, j))]*25500},${this.vy[(indexer(i, j))]*25500},255, ${den})`
                    if(den > .1){
                        canvas_context.fillRect(i, j, 1, 1);
                    }
                }
            }

        }
        step() {
            //bad code
            // let visc = this.visc
            // let diff = this.diff
            // let dt = this.dt
            // let vx = [...this.vx]
            // let vy = [...this.vy]
            // let vx0 = [...this.vx0]
            // let vy0 = [...this.vy0]
            // let s = [...this.s]
            // let density = [...this.density]

            // diffuse(1, vx0, vx, visc, dt);
            // diffuse(2, vy0, vy, visc, dt);

            // project(vx0, vy0, vx, vy);

            // advect(1, vx, vx0, vx0, vy0, dt);
            // advect(2, vy, vy0, vx0, vy0, dt);

            // project(vx, vy, vx0, vy0);

            // diffuse(0, s, density, diff, dt);
            // advect(0, density, s, vx, vy, dt);
            //end of bad code


            diffuse(1, this.vx0, this.vx, this.visc, this.dt);
            diffuse(2, this.vy0, this.vy, this.visc, this.dt);

            project(this.vx0, this.vy0, this.vx, this.vy);

            advect(1, this.vx, this.vx0, this.vx0, this.vy0, this.dt);
            advect(2, this.vy, this.vy0, this.vx0, this.vy0, this.dt);

            project(this.vx, this.vy, this.vx0, this.vy0);

            diffuse(0, this.s, this.density, this.diff, this.dt);
            advect(0, this.density, this.s, this.vx, this.vy, this.dt);
        }
        addDensity(x, y, density) {
            let index = indexer(x, y)
            this.density[index] += density
        }
        addVelocity(x, y, xmom, ymom) {
            let index = indexer(x, y)
            this.vx[index] += xmom
            this.vy[index] += ymom
            // //console.log(this.vx)
        }

    }

    function indexer(x, y) {
        let truer = x + (y * canvas.width)
        truer = Math.max(truer,0)
        truer = Math.min(truer,fluid.vx.length-1)
        return truer
    }


    function diffuse(b, x, x0, diff, dt) {

        let a = dt * diff * (canvas.width - 2) * (canvas.width - 2);
        linearSolve(b, x, x0, a, 1 + 4 * a);

    }

    function advect(b, d, d0, velocX, velocY, dt) {
        let i0, i1, j0, j1;

        let dtx = dt * (canvas.width - 2);
        let dty = dt * (canvas.width - 2);

        let s0, s1, t0, t1;
        let tmp1, tmp2, x, y;

        let Nfloat = canvas.width;
        let ifloat, jfloat;
        let i, j;

        for (j = 1, jfloat = 1; j < canvas.width - 1; j++, jfloat++) {
            for (i = 1, ifloat = 1; i < canvas.width - 1; i++, ifloat++) {
                tmp1 = dtx * velocX[indexer(i, j)];
                tmp2 = dty * velocY[indexer(i, j)];
                x = ifloat - tmp1;
                y = jfloat - tmp2;

                if (x < 0.5) x = 0.5;
                if (x > Nfloat + 0.5) x = Nfloat + 0.5;
                i0 = Math.floor(x);
                i1 = i0 + 1.0;
                if (y < 0.5) y = 0.5;
                if (y > Nfloat + 0.5) y = Nfloat + 0.5;
                j0 = Math.floor(y);
                j1 = j0 + 1.0;

                s1 = x - i0;
                s0 = 1.0 - s1;
                t1 = y - j0;
                t0 = 1.0 - t1;

                let i0i = Math.round(i0);
                let i1i = Math.round(i1);
                let j0i = Math.round(j0);
                let j1i = Math.round(j1);

                // DOUBLE CHECK THIS!!!
                d[indexer(i, j)] =
                    s0 * (t0 * d0[indexer(i0i, j0i)] + t1 * d0[indexer(i0i, j1i)]) +
                    s1 * (t0 * d0[indexer(i1i, j0i)] + t1 * d0[indexer(i1i, j1i)]);
            }
        }

        set_bnd(b, d);

    }


    function set_bnd(b, x) {
        for (let i = 1; i < canvas.width - 1; i++) {
            if(b ==2){
                x[indexer(i, 0)] =  -x[indexer(i, 1)]
                x[indexer(i, canvas.width - 1)] = -x[indexer(i, canvas.width - 2)] 
            }else{
                x[indexer(i, 0)] =x[indexer(i, 1)]; 
                x[indexer(i, canvas.width - 1)] = x[indexer(i, canvas.width - 2)];
            }
        }
        for (let j = 1; j < canvas.width - 1; j++) {
            x[indexer(0, j)] = b == 1 ? -x[indexer(1, j)] : x[indexer(1, j)];
            x[indexer(canvas.width - 1, j)] = b == 1 ? -x[indexer(canvas.width - 2, j)] : x[indexer(canvas.width - 2, j)];
        }

        x[indexer(0, 0)] = 0.5 * (x[indexer(1, 0)] + x[indexer(0, 1)]);
        x[indexer(0, canvas.width - 1)] = 0.5 * (x[indexer(1, canvas.width - 1)] + x[indexer(0, canvas.width - 2)]);
        x[indexer(canvas.width - 1, 0)] = 0.5 * (x[indexer(canvas.width - 2, 0)] + x[indexer(canvas.width - 1, 1)]);
        x[indexer(canvas.width - 1, canvas.width - 1)] = 0.5 * (x[indexer(canvas.width - 2, canvas.width - 1)] + x[indexer(canvas.width - 1, canvas.width - 2)]);
    }



    function project(velocX, velocY, p, div) {

        // //console.log(velocX, velocY)
        for (let j = 1; j < canvas.width - 1; j++) {
            for (let t = 1; t < canvas.width - 1; t++) {
                div[indexer(t, j)] = .5 * (
                    velocX[indexer(t + 1, j)]
                    - velocX[indexer(t - 1, j)]
                    + velocY[indexer(t, j + 1)]
                    - velocY[indexer(t, j - 1)]
                ) / canvas.width;
        
                p[indexer(t, j)] = 0;
            }
        }

        set_bnd(0, div);
        set_bnd(0, p);
        linearSolve(0, p, div, 1, 4);

        for (let j = 1; j < canvas.width - 1; j++) {
            for (let i = 1; i < canvas.width - 1; i++) {
                velocX[indexer(i, j)] -= .5 * (p[indexer(i + 1, j)]
                    - p[indexer(i - 1, j)]) * canvas.width;
                velocY[indexer(i, j)] -= .5 * (p[indexer(i, j + 1)]
                    - p[indexer(i, j - 1)]) * canvas.width;
            }
        }
        set_bnd(1, velocX);
        set_bnd(2, velocY);




    }

    function linearSolve(b, x, x0, a, c) {

        let cRecip = 1 / c
        for (let k = 0; k < iter; k++) {
            for (let j = 1; j < canvas.width - 1; j++) {
                for (let t = 1; t < canvas.width - 1; t++) {
                    x[indexer(t, j)] = (x0[indexer(t, j)] + a * (x[indexer(t + 1, j)] + x[indexer(t - 1, j)] + x[indexer(t, j + 1)] + x[indexer(t , j - 1)])) * cRecip
                }
            }
            set_bnd(b, x);
        }
    }

    let fluid = new Fluid(1 , 0.0009, 0.0005);
    // //console.log(fluid)
    let iter = 16
    let time = 0
 let v = {}

    function fluidDraw() {
        let cx = Math.round(0.5 * canvas.width );
        let cy = Math.round(0.5 * canvas.height);
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                fluid.addDensity(cx + i, cy + j, (Math.random() * 100) + 50)
            }
        }
        for (let i = 0; i < 2; i++) {
            let angle =  0+(Math.random()*.1)//Math.random()*2*Math.PI//0 //+Math.random()-.5 //Math.random()*2*Math.PI //*2*Math.random() ;
           
            v.x = Math.cos(angle) * .2
            v.y = Math.sin(angle) * .2
            // console.log(v)
            fluid.addVelocity(cx, cy, v.x, v.y);
        }


        fluid.step();
        fluid.renderD();

    }

    function main() {
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        fluidDraw()
        // fluid.step();
    }



})
