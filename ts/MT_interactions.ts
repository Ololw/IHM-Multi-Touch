import { FSM } from "./FSM";
import * as transfo from "./transfo";

function multiTouch(element: HTMLElement) : void {
    let pointerId_1 : number, Pt1_coord_element : SVGPoint, Pt1_coord_parent : SVGPoint,
        pointerId_2 : number, Pt2_coord_element : SVGPoint, Pt2_coord_parent : SVGPoint,
        originalMatrix : SVGMatrix,
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
        getRelevantDataFromEvent = (evt : TouchEvent) : Touch => {
            for(let i=0; i<evt.changedTouches.length; i++) {
                let touch = evt.changedTouches.item(i);
                if(touch.identifier === pointerId_1 || touch.identifier === pointerId_2) {
                    return touch;
                }
            }
            return null;
        };
    enum MT_STATES {Inactive, Translating, Rotozooming}
    let fsm = FSM.parse<MT_STATES>( {
        initialState: MT_STATES.Inactive,
        states: [MT_STATES.Inactive, MT_STATES.Translating, MT_STATES.Rotozooming],
        transitions : [
            { from: MT_STATES.Inactive, to: MT_STATES.Translating,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {
                        evt.preventDefault();

                        pointerId_1 = 0;
                        pointerId_2 = 1;
                        
                        //On recup la matrice de l'element et le point du touch
                        originalMatrix = transfo.getMatrixFromElement(element);
                        Pt1_coord_element = transfo.getPoint(evt.touches[pointerId_1].clientX, evt.touches[pointerId_1].clientY).matrixTransform(originalMatrix.inverse());
                        Pt1_coord_parent = transfo.getPoint(evt.touches[pointerId_1].clientX, evt.touches[pointerId_1].clientY);

                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    //On recupere le point du touch
                    Pt1_coord_parent = svg.createSVGPoint();
                    Pt1_coord_parent.x = evt.touches[0].clientX;
                    Pt1_coord_parent.y = evt.touches[0].clientY;
                    //On utilise la fonction drag afin de calculer la nouvelle matrice et changer la place de l'element
                    transfo.drag(element, originalMatrix, Pt1_coord_element, Pt1_coord_parent);
                    return true;
                }
            },
            { from: MT_STATES.Translating,
                to: MT_STATES.Inactive,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    return true;
                }
            },
            { from: MT_STATES.Translating, to: MT_STATES.Rotozooming,
                eventTargets: [element],
                eventName: ["touchstart"],
                useCapture: false,
                action: (evt : TouchEvent) : boolean => {
                    Pt2_coord_element = transfo.getPoint(evt.touches[pointerId_2].clientX, evt.touches[pointerId_2].clientY).matrixTransform(originalMatrix.inverse());
                    Pt2_coord_parent = transfo.getPoint(evt.touches[pointerId_2].clientX, evt.touches[pointerId_2].clientY);
                    return true;
                }
            },
            { from: MT_STATES.Rotozooming, to: MT_STATES.Rotozooming,
                eventTargets: [document],
                eventName: ["touchmove"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    evt.preventDefault();
                    evt.stopPropagation();

                    //On recupere les points des deux touches 
                    Pt1_coord_parent = svg.createSVGPoint();
                    Pt1_coord_parent.x = evt.touches[pointerId_1].clientX;
                    Pt1_coord_parent.y = evt.touches[pointerId_1].clientY;

                    Pt2_coord_parent = svg.createSVGPoint();
                    Pt2_coord_parent.x = evt.touches[pointerId_2].clientX;
                    Pt2_coord_parent.y = evt.touches[pointerId_2].clientY;
                    //Puis on utilise la fonction rotozoom pour changer la matrice de l'element et l'appliquer
                    transfo.rotozoom(element, originalMatrix, Pt1_coord_element, Pt1_coord_parent, Pt2_coord_element, Pt2_coord_parent);
                    return true;
                }
            },
            { from: MT_STATES.Rotozooming,
                to: MT_STATES.Translating,
                eventTargets: [document],
                eventName: ["touchend"],
                useCapture: true,
                action: (evt : TouchEvent) : boolean => {
                    const touch = getRelevantDataFromEvent(evt);
                    Pt1_coord_element = transfo.getPoint(touch.clientX, touch.clientY).matrixTransform(originalMatrix.inverse());
                    Pt1_coord_parent = transfo.getPoint(touch.clientX, touch.clientY);
                    return true;
                }
            }
        ]
    } );
    fsm.start();
}

//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
//______________________________________________________________________________________________________________________
function isString(s : any) : boolean {
    return typeof(s) === "string" || s instanceof String;
}

export let $ = (sel : string | Element | Element[]) : void => {
    let L : Element[] = [];
    if( isString(sel) ) {
        L = Array.from( document.querySelectorAll(<string>sel) );
    } else if(sel instanceof Element) {
        L.push( sel );
    } else if(sel instanceof Array) {
        L = sel;
    }
    L.forEach( multiTouch );
};
