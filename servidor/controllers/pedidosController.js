const Pedidos = require("../models/Pedidos");
const Clientes = require("../models/Cliente");
const Electronico = require("../models/Electronico");
const Cliente = require("../models/Cliente");
const DispositivosIndividuales = require("../models/DispositivosIndividuales");
var generator = require('generate-serial-number');
let fs = require('fs');
const axios = require('axios');

exports.crearPedido = async (req, res) => {
    try{
        let pedido;

        //Creamos nuestro pedido con los datos provenientes de ventas
        pedido = new Pedidos(req.body);
        console.log(pedido);

        //Se obtiene el json con la informacion del cliente
        let datosCliente = await Cliente.findById(pedido.cliente);
        console.log(datosCliente);
        pedido.empresa = datosCliente.empresa;

        //Obtenemos los dias de entrega
        let diasCliente = datosCliente.diasEntrega;

        //Se crea una variable de tipo fecha
        let date = new Date();
        let dias = diasCliente;

        //Se ingresan los dias en el pedido
        pedido.entrega = dias;

        //A la fecha actual se le suman los dias de entrega
        date.setDate(date.getDate() + dias);

        //Se ingresa la fecha en el pedido
        pedido.fechaEntrega = date;

        
        //Obtenemos el _id del pedido para ligarlo a los dispositivos generados
        let idPedido = pedido._id.toHexString();
        //console.log(idPedido);
        //Cantidad de dispositivos a generar
        let count = pedido.cantidad;

        //Obtener las caracteristicas del intentario
        const jsonInventario = await Electronico.findById(pedido.idInventario);
        //console.log(jsonInventario);
        pedido.categoria = jsonInventario.categoria;
        pedido.modelo = jsonInventario.modelo;


        const jsonCliente = await Clientes.findById(pedido.cliente);
        //console.log(jsonCliente);

        
        for (var i = 0; i<count; i++){

            let dispositivo;
            //Creacion del dispositivo
            dispositivo = new DispositivosIndividuales();
            dispositivo.serie = generator.generate(20);
            dispositivo.categoria = jsonInventario.categoria;
            dispositivo.empresa = jsonCliente.empresa;
            dispositivo.idCliente = pedido.cliente;
            dispositivo.idInventario = pedido.idInventario; 
            dispositivo.idPedidos = idPedido;


            
            await dispositivo.save();
            //console.log(dispositivo);
            pedido.dispositivos.push({"serie":dispositivo.serie});

        }

        await pedido.save();
        res.send(pedido);
    }catch(error){
        console.log(error);
        res.status(500),send("Hubo un error");
    }
}

exports.obtenerPedidos= async (req,res)=>{
    try{
        const pedido= await Pedidos.find();
        res.json(pedido);
    }catch(error){
        console.log(error);
        res.status(500),send("Hubo un error");
    }
}
exports.actualizarPedido = async (req,res)=>{
    
    try{
        const { entrega } = req.body;
        let pedido = await Pedidos.findById(req.params.id);

        console.log(pedido  );
        if(!pedido){
            res.status(404).json({msg: 'No existe el elemento'})
        }
        pedido.entrega = entrega;

        pedido = await Pedidos.findOneAndUpdate ({ _id:req.params.id}, 
            {

                estado:"entregado"


            }, {new:true});
        res.json(pedido);

    }catch(error){
        console.log(error);
        res.status(500),send("Hubo un error");
    }
}


exports.estadoPedido = async (req,res)=>{
    try{
        const { idPedidoVentas, cliente, estado, responsable} = req.body;
        //console.log(req.body);
        let pedido = await Pedidos.findOneAndUpdate({idPedidoVentas:idPedidoVentas,cliente:cliente},{
            estado:estado
        }, {new:true});
        console.log(pedido);

        if(!pedido){
            res.status(404).json({msg: 'No existe el elemento'})
        }
        
        pedido.estado = estado;

        if(pedido.estado == "cancelado"){
            var date = new Date().toLocaleDateString().replace("/", "-").replace("/", "-");
            var time = new Date();
            //date.format("%Y-%m-%d-%H:%M:%S");
            console.log(date);
            var dateString =  date;
            console.log(dateString);

            //let pedido = await Pedidos.findById(idPedidos);
            let datosCliente = await Cliente.findById(pedido.cliente); 

            var contenidoLog = 
                "Se ha cancelado el pedido con el identificador "+idPedidoVentas+"\n"
                +"La operacion fue realizada por el empleado "+ responsable + " de la empresa " + datosCliente.empresa +  "\n"
                +"El dia "+dateString+" a la hora "+ time.getHours()+":"+time.getMinutes()+":"+time.getSeconds() ;
            try {
                fs.appendFile('logs/'+ dateString +" "+ time.getHours()+"-"+time.getMinutes()+"-"+time.getSeconds()+" "+datosCliente.empresa+' log.txt', contenidoLog ,function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                  });
                //file written successfully
              } catch (err) {
                console.error(err)
              }
            //var logFile = fs.writeFile('logs/'+ date +'log.txt', "prueba");
        }

        /*
        pedido = await Pedidos.findOneAndUpdate ({ _id:idPedidos}, 
            {
                estado:pedido.estado
            }, {new:true});*/
        res.json(pedido);

    }catch(error){
        console.log(error);
        res.status(500),send("Hubo un error");
    }
}

exports.enviarPedido= async (req,res)=>{
    try{
        const {idPedido, estado} = req.body;

        //Obtenemos el pedido para obener la informacion
        let pedido = await Pedidos.findOneAndUpdate({_id:idPedido},{estado:estado});
        //console.log(pedido);

        let cliente = await Cliente.findById(pedido.cliente); 
        console.log(cliente);


        var ipVentas = cliente.ip;
        var nId = pedido.idPedidoVentas;
        var nIdInventario = pedido.idInventarioVentas;
        //console.log(nId);
        var nEstado = estado;
        var nFecha = Date.now();

        //Se obtiene el array de los numeros de serie
        var dispositivos = pedido.dispositivos;
        //Se obtiene el tamaño del arreglo
        var counter = pedido.cantidad;
        //console.log(dispositivos[1].serie);

        /*
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };*/

        //El metodo trabaja con form data/parametros por lo que se arma el string con los parametros
        stringPost = "http://"+ipVentas+":8080/Pedidos/Estado?nId="+nId+"&nEstado="+nEstado+"&nFecha="+nFecha;
        console.log(stringPost);

        let boolGarantia = pedido.pedidoGarantia;

        //Se realiza el axios post, el metodo en ventas es un void por lo que solo confirmamos que se realizo el post
        axios.post(stringPost).then(response => {

            //var estadoDispositivo = 3;
            
            for( var i = 0; i < counter; i++){
                var serie = dispositivos[i].serie;
                
                if(boolGarantia == true){
                    //Se hace el insert en ventas con el numero de serie y el id del inventario en ventas y se ingresa como vendido
                    var stringPostGarantia = "http://"+ipVentas+":8080/Dispositivos_individuales/Prueba?nSerie="+serie+"&nId="+nIdInventario+"&nVendido=1";
                    axios.post(stringPostGarantia);
                    //console.log(stringPost2);
                }else{
                    //Se hace el insert en ventas con el numero de serie y el id del inventario en ventas
                    var stringPost2 = "http://"+ipVentas+":8080/Dispositivos_individuales/Insertar?nSerie="+serie+"&nId="+nIdInventario;
                    axios.post(stringPost2);
                    //console.log(stringPost2);
                }
                
            }
            
            
            var respuesta = {"Respuesta":"ok"};

            res.json(respuesta);
        });;
        
    }catch(error){
        console.log(error);
        res.status(500),send("Hubo un error");
    }
}
