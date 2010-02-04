var HAITI = {
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
};

Ext.onReady(function() {
    var enable_gmaps = false;
    Ext.BLANK_IMAGE_URL = 'images/s.gif';
    
    Ext.DomHelper.append(document.body,
                         {tag: 'div',id: 'address2'});
    Ext.get('address_div').show();

    var map_options = { 
        'units' : "m",
        'maxResolution' : 156543.0339,
        'numZoomLevels' : 22,
        'projection' : new OpenLayers.Projection("EPSG:900913"),
        'displayProjection' : new OpenLayers.Projection("EPSG:4326"),
        'maxExtent' : new OpenLayers.Bounds(-20037508.34,-20037508.34,
                                            20037508.34,20037508.34),
        'controls': [new OpenLayers.Control.Navigation(), new OpenLayers.Control.PanZoomBar(),
                     new OpenLayers.Control.Attribution()],
        'theme': 'css/style.css'             };
    
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

    OpenLayers.ProxyHost = "proxy.cgi?url=";

    var map = new OpenLayers.Map('mappanel', map_options);
    HAITI.map = map;
    var layerRoot = new Ext.tree.TreeNode({
        text: "All Layers",
        expanded: true
    });
    var layer_groups = [];
    var sfc_overlays = [];
    /////////////////////////////////////
    // OSM Base Layers
    /////////////////////////////////////
    // var OSM_mapnik = new OpenLayers.Layer.XYZ(
    //     "OpenStreetMap (Haiti) local", 
    //     "tiles/osm/${z}/${x}/${y}.png",
    //     {
    //         type: 'png', getURL: osm_getTileURL,
    //         displayOutsideMaxExtent: true,
    //         attribution: '<a href="http://www.openstreetmap.org/">' +
    //             'OpenStreetMap</a>',
    //         buffer: 0, linkId: 'osm'    
    //     }
    // );

    var OSM_local = new OpenLayers.Layer.XYZ(
        "OpenStreetMap (Haiti) local",
        "tiles/osm/${z}/${x}/${y}.png",
        {
            buffer:0,
            visibility: false, linkId:'basephoto',
            numZoomLevels: 19
        }
    );    
    map.addLayers([OSM_local]);
       
    var haiti_best = new OpenLayers.Layer.XYZ("Satellite/Aerial Imagery",
        "tiles/haiti-best-900913/${z}/${x}/${y}.jpeg",
        {
            buffer:0,
            visibility: false, linkId:'basephoto',
            numZoomLevels: 19
        }
    );
    map.addLayer(haiti_best);


    // var OSM_mapnik = new OpenLayers.Layer.TMS(
    //     "OpenStreetMap (Haiti)",
    //     "http://live.openstreetmap.nl/haiti/",
    //     {
    //         type: 'png', getURL: osm_getTileURL,
    //         displayOutsideMaxExtent: true,
    //         attribution: '<a href="http://www.openstreetmap.org/">' +
    //             'OpenStreetMap</a>',
    //         buffer: 0, linkId: 'osm'    
    //     }
    // );
    // map.addLayers([OSM_mapnik]);    
    // 
    // Layer root container
    layerRoot.appendChild(new GeoExt.tree.BaseLayerContainer({
        text: "Base Layers",
        map: map,
        draggable:false,
        expanded: true
    }));    
    /////////////////////////////////////
    // High Res Aerial Image Layers
    /////////////////////////////////////
    // hires_layers = [];
    // var worldbank_012410_tc = new OpenLayers.Layer.XYZ(
    //     "Worldbank (2010/01/24)",
    //     "http://tiles.babylon/tilecache.cgi/1.0.0/worldbank-24-900913/${z}/${x}/${y}.jpg",
    //     {
    //         isBaseLayer: false, buffer:0,
    //         visibility: false, linkId: 'wb24'
    //     }
    // );
    // hires_layers.push(worldbank_012410_tc);
    // var noaa_012410_tc = new OpenLayers.Layer.XYZ(
    //     "NOAA Aerial (2010/01/24)",
    //     "http://tiles.babylon/tilecache.cgi/1.0.0/noaa-20100124-900913/${z}/${x}/${y}.jpg",
    //     {
    //         isBaseLayer: false, buffer:0,
    //         visibility: false, linkId: 'noaa24'
    //     }
    // );
    // hires_layers.push(noaa_012410_tc);
    // map.addLayers(hires_layers);
    // 

    /////////////////////////////////////
    // Topo Layers
    /////////////////////////////////////
    var topo_layers = [];
    var tlm = new OpenLayers.Layer.XYZ(
        "Haiti Collarless 1:50k",
        "http://hypercube.telascience.org/tiles/1.0.0/haiti-tlm-50/${z}/${x}/${y}.jpg",
        {
            isBaseLayer: false, buffer:0,
            visibility: false, linkId: 'tlm50'
        }
    );
    topo_layers.push(tlm); 
    var city = new OpenLayers.Layer.XYZ(
        "PAP Collared 1:12.5k",
        "http://hypercube.telascience.org/tiles/1.0.0/haiti-city/${z}/${x}/${y}.jpg",
        {
            isBaseLayer: false, buffer:0,
            visibility: false, linkId: 'city'
        }
    );
    topo_layers.push(city); 
    map.addLayers(topo_layers);

    /////////////////////////////////////
    // OSM Overlay Layers
    /////////////////////////////////////
    var osm_layers = [];
    var osm_camps_wms = new OpenLayers.Layer.XYZ(
        "Damage/IDP Camps",
        "tiles/refugee/${z}/${x}/${y}.png",
        {
            buffer: 0, isBaseLayer: false,
            'sphericalMercator': true,
            visibility: false, numZoomLevels: 17,
            linkId: 'osmcamps' 
        }
    );
    osm_layers.push(osm_camps_wms); 
    var osm_overlay = new OpenLayers.Layer.XYZ(
        "Roads Overlay",
        "tiles/osm-line/${z}/${x}/${y}.png",
        {
            isBaseLayer: false, buffer:0,
            visibility: false, numZoomLevels: 17,
            linkId: 'osmroads'
        }
    );
    osm_layers.push(osm_overlay); 
    map.addLayers(osm_layers);




    /////////////////////////////////////
    // Ushahidi Overlays
    /////////////////////////////////////
    // var ushahidi_overlays = [];
    // 
    // // Incidents
    // var ushahidiIncidents = new OpenLayers.Layer.Vector("Latest 100 Incidents", {
    //     projection: map.displayProjection,
    //     strategies: [new OpenLayers.Strategy.Fixed()],
    //     visibility: false,
    //     format: OpenLayers.Format.GeoRSS, 
    //     styleMap: new OpenLayers.StyleMap({'externalGraphic': "http://www.hcvb.org/Directory/Emergency_icon.gif",
    //                                        pointRadius: 10}),
    //     protocol: new OpenLayers.Protocol.HTTP({
    //         url: "http://haiti.ushahidi.com/feed/?l=100",
    //         format: new OpenLayers.Format.GeoRSS({
    //             extractStyles: true, 
    //             extractAttributes: true
    //         })
    //     }),
    //     linkId: 'ushinc',
    //     visibility: false
    // });
    // ushahidiIncidents.events.on({
    //     "featureselected": onFeatureSelect,
    //     "featureunselected": onFeatureUnselect
    // });
    // sfc_overlays.push(ushahidiIncidents);       
    // ushahidi_overlays.push(ushahidiIncidents);  
    // map.addLayers(ushahidi_overlays);



    /////////////////////////////////////
    // GeoCommons Overlays
    /////////////////////////////////////
    var idp_camps = [];

    //Shake Map
    var geocommonsShake = new OpenLayers.Layer.GML(
        "Shake Map", 
        "data/geocommons/10992.kml",
        {
            projection: map.displayProjection,
            format: OpenLayers.Format.KML, 
            formatOptions: {
                maxDepth: 3,
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'gcshake',
            visibility: false
        }
    );
    geocommonsShake.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    idp_camps.push(geocommonsShake);      
    sfc_overlays.push(geocommonsShake); 

    var papIDP = new OpenLayers.Layer.GML(
        "Port-au-Prince IDP Camps (1/15/10)", "data/geocommons/pap_idp_2010_01_24.kml", 
        {
            projection: map.displayProjection,
            format: OpenLayers.Format.KML, 
            formatOptions: {
                maxDepth: 3,
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'papIDP',
            visibility: false
        }
    );

    papIDP.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    idp_camps.push(papIDP);      
    sfc_overlays.push(papIDP);  
    
    var carrefourIDP = new OpenLayers.Layer.GML(
        "Carrefour IDP Camps (1/15/10)", "data/geocommons/carrefour_idp_2010_01_15.kml", 
        {
            projection: map.displayProjection,
            format: OpenLayers.Format.KML, 
            formatOptions: {
                maxDepth: 3,
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'carrefourIDP',
            visibility: false
        }
    );

    carrefourIDP.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    idp_camps.push(carrefourIDP);      
    sfc_overlays.push(carrefourIDP);  
    
    var refugeeCamps = new OpenLayers.Layer.GML(
        "IDP Camps from OSM (1/18-29/10)", "data/geocommons/301.kml", 
        {
            projection: map.displayProjection,
            format: OpenLayers.Format.KML, 
            formatOptions: {
                maxDepth: 3,
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'refugeeCamps',
            visibility: false
        }
    );

    refugeeCamps.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    idp_camps.push(refugeeCamps);      
    sfc_overlays.push(refugeeCamps);      
              
    /////////////////////////////////////
    // Sahana Overlays
    /////////////////////////////////////
    var response_locations = [];


    //Medical Centers
    var geocommonsMedical = new OpenLayers.Layer.GML(
        "Medical Centers (GeoCommons)", "data/geocommons/302.kml", 
        {
            projection: map.displayProjection,
            format: OpenLayers.Format.KML, 
            formatOptions: {
                maxDepth: 3,
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'gcmedical',
            visibility: false
        }
    );

    geocommonsMedical.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    response_locations.push(geocommonsMedical);      
    sfc_overlays.push(geocommonsMedical);    
    
    //Hospitals
    var sahanaHospitals = new OpenLayers.Layer.GML(
        "Hospitals (Sahana)", 
        "data/sahana_hospital.kml", 
        {
            projection: map.displayProjection,
            visibility: false,
            format: OpenLayers.Format.KML, 
            styleMap: new OpenLayers.StyleMap({'externalGraphic': "images/markers/gis_marker.image.E_Med_Hospital_S1.png", pointRadius: 10}),
            formatOptions: {
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'sahhosp',
        }
    );
    sahanaHospitals.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    response_locations.push(sahanaHospitals);      
    sfc_overlays.push(sahanaHospitals); 
    
    //Offices
    var sahanaOffices = new OpenLayers.Layer.GML(
        "Offices", 
        "data/sahana_office.kml", 
        {
            projection: map.displayProjection,
            visibility: false,
            format: OpenLayers.Format.KML, 
            styleMap: new OpenLayers.StyleMap({'externalGraphic': "images/markers/gis_marker.image.Emergency_Operations_Center_S1.png", pointRadius: 10}),
            formatOptions: {
                extractStyles: true, 
                extractAttributes: true
            },
            linkId: 'sahoff',
        }
    );
    sahanaOffices.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    response_locations.push(sahanaOffices);        
    sfc_overlays.push(sahanaOffices);   

    //Food Distribution Centers
    /*var foodDistributionCenters = new OpenLayers.Layer.Vector("Food Distribution Centers", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        visibility: false,
        format: OpenLayers.Format.KML, 
        styleMap: new OpenLayers.StyleMap({'externalGraphic': "http://www.realmexmipueblo.com/images/food_icon.gif",
                                           pointRadius: 10}),
        protocol: new OpenLayers.Protocol.HTTP({
            url: "http://ispatial.t-sciences.com/haiti/tmp/kml/e6e/2a2/097/46d/major_food__water_distribution_centers_haiti_1.19.2010.kml",
            format: new OpenLayers.Format.KML({
                extractStyles: false, 
                extractAttributes: true
            })
        }),
        linkId: 'fooddist',
        visibility: false
    });
    foodDistributionCenters.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    sfc_overlays.push(foodDistributionCenters); 
    overlays.push(foodDistributionCenters);    */ 

    map.addLayers(response_locations);
    map.addLayers(idp_camps);
    /////////////////////////////////////
    // InRelief Overlays
    /////////////////////////////////////
    /*var inrelief_overlays = [];

    var spotLastLoc = new OpenLayers.Layer.Vector("SPOT Last Location", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        visibility: false,
        format: OpenLayers.Format.KML, 
        protocol: new OpenLayers.Protocol.HTTP({
            url: "http://hurakan.ucsd.edu/cwid/NspotLastLocation.kml",
            format: new OpenLayers.Format.KML({
                extractAttributes: true,
                maxDepth: 3
            })
        }),
        linkId: 'spot1',
        visibility: false
    });
    spotLastLoc.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    inrelief_overlays.push(spotLastLoc);        
    sfc_overlays.push(spotLastLoc);     
    var spotMessage = new OpenLayers.Layer.Vector("SPOT Message", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        visibility: false,
        format: OpenLayers.Format.KML, 
        protocol: new OpenLayers.Protocol.HTTP({
            url: "http://hurakan.ucsd.edu/cwid/NspotMessage.kml",
            format: new OpenLayers.Format.KML({
                extractAttributes: true,
                maxDepth: 3
            })
        }),
        linkId: 'spot2',
        visibility: false
    });
    spotMessage.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    inrelief_overlays.push(spotMessage);        
    sfc_overlays.push(spotMessage);     
    
    var latitude = new OpenLayers.Layer.Vector("SPOT Latitude", {
        projection: map.displayProjection,
        strategies: [new OpenLayers.Strategy.Fixed()],
        visibility: false,
        format: OpenLayers.Format.KML, 
        protocol: new OpenLayers.Protocol.HTTP({
            url: "http://hurakan.ucsd.edu/cwid/Latitude.kml",
            format: new OpenLayers.Format.KML({
                extractAttributes: true,
                maxDepth: 3
            })
        }),
        linkId: 'spot3',
        visibility: false
    });
    latitude.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    inrelief_overlays.push(latitude);   
    sfc_overlays.push(latitude);        
    


    map.addLayers(inrelief_overlays);
    */

    // drawing_layers = [];
    // var params = OpenLayers.Util.getParameters();
    // var editingLayer;
    // if (params.editlayers) {
    //     var editId = params.editlayers.split(",")[0];
    //     editingLayer = new OpenLayers.Layer.GML("Local Layer " + editId, 
    //         "http://cmapdemo.labs.metacarta.com/featurestore/layer/" + editId,
    //         {'remote_id': parseInt(editId), format: OpenLayers.Format.GeoJSON, editLayer: true, projection: new OpenLayers.Projection("EPSG:4326"), visibility: false}
    //     );
    // } else {   
    //     editingLayer = new OpenLayers.Layer.Vector("Local Layer", {'editLayer': true});
    // }
    // HAITI.editingLayer = editingLayer;
    // drawing_layers.push(editingLayer);
    // editingLayer.events.on({
    //     "featureselected": onFeatureSelect,
    //     "featureunselected": onFeatureUnselect
    // });
    // sfc_overlays.push(editingLayer);
    // map.addLayers(drawing_layers);



    var sf = new OpenLayers.Control.SelectFeature(sfc_overlays, {clickOut: true});
    map.addControl(sf);
    sf.activate();
    HAITI.sfc = sf;
    var image_overlays = [];
    var pdf_6k = new OpenLayers.Layer.WMS("6K Delta State PDFs (Click for link)",
        "http://hypercube.telascience.org/cgi-bin/mapserv", {
            'map':'/geo/haiti/mapfiles/vector.map',
            'layers':'pdf_6k', 'transparent': true
        }, {
            buffer: 0, isBaseLayer: false, visibility: false,
            linkId: 'pdf6k'
        }    
                                          
                                         );    
    pdf_6k.events.on({
        "visibilitychanged": function() { 
            if (this.visibility) {
                if (!this.control) {
                    this.control = new OpenLayers.Control.Click();
                    this.map.addControl(this.control);
                }
                this.control.activate();
            } else {
                this.control.deactivate();
            }    
        },
        'scope': pdf_6k
    });    
    image_overlays.push(pdf_6k);
    
    var warper_wfp28 = new OpenLayers.Layer.WMS("WFP Logistics (01-28)",
        "http://warper.geothings.net/maps/wms/2013", 
        {'format': 'image/jpeg'}, 
        {isBaseLayer: false, 
         singleTile: true,
         transitionEffect: 'resize', 
         visibility: false});
    image_overlays.push(warper_wfp28);
    map.addLayers(image_overlays);
   
    lookupLayer = new OpenLayers.Layer.Vector("", {styleMap: new OpenLayers.StyleMap({'pointRadius': 4, 'fillColor': 'red'})});
    map.addLayer(lookupLayer);


    /////////////////////////////////////
    // Layer Stores
    /////////////////////////////////////

    // This actually determines the order of the groups
    layer_groups.push({name:'Infrastructure', layers:osm_layers,
                       expanded:true});
    // layer_groups.push({name:'Image Overlays', layers:image_overlays,
    //                    expanded:true});
    // layer_groups.push({name:'Ushahidi Overlays', layers:ushahidi_overlays,
    //                    expanded:true});
    layer_groups.push({name:'IDP Camps', layers:idp_camps,
                       expanded:true});
    layer_groups.push({name:'Response Locations', layers:response_locations,
                       expanded:true});
    // layer_groups.push({name:'Drone-style Overlays', layers:p3_overlays,
    //                    expanded:false});
    // layer_groups.push({name:'Topo Maps', layers:topo_layers,
    //                    expanded:false});
    // layer_groups.push({name:'Hi Res Aerials Image', layers:hires_layers,expanded:false});
    // layer_groups.push({name:'Digital Globe', layers:dglobe_layers,
    //                    expanded:false});
    // layer_groups.push({name:'GeoEye', layers:geoeye_layers,
    //                    expanded:false});
    // layer_groups.push({name:'CNES/SpotImage', layers:spot_layers,
    //                    expanded:false});
    /*layer_groups.push({name:'InRelief Overlays', layers:inrelief_overlays,
                       expanded:false});*/
    // layer_groups.push({'name': "Local Drawing Layers", layers: drawing_layers, expanded: false});
    for (var p=0; p<layer_groups.length; p+=1){
        var my_layers = layer_groups[p]["layers"];
        var my_store = new GeoExt.data.LayerStore({
            map: map,
            initDir: GeoExt.data.LayerStore.MAP_TO_STORE|GeoExt.data.LayerStore.STORE_TO_MAP,
            layers: layer_groups[p]["layers"]
        });
        // Actually add to the tree...
        layerRoot.appendChild(new GeoExt.tree.LayerContainer({
            text: layer_groups[p]["name"],
            layerStore: my_store,
            expanded: layer_groups[p]["expanded"],
            draggable:false,
            loader: new GeoExt.tree.LayerLoader({
                layers: layer_groups[p]["layers"],
                filter: function(record) {
                    var layer = record.get("layer");
                    var layers = this.layers;
                    return contains(layers, layer);
                }
            })
        }));
    }


    HAITI.stores = [];
    HAITI.store_lyrs = [];
    HAITI.lyrs = []
    ////// Add Control for PDF Selection ///////
    ////// Sourced From Controls.js
    var showLoc = new ShowLoc(); 
    var streetQuery = new StreetQuery();
    HAITI.streetQuery = streetQuery;
    var selectPdfControl = new SelectPdfControl();
    ///////////////////////////////////////////
    map.addControl(new OpenLayers.Control.MGRSMousePosition());
    map.addControl(new OpenLayers.Control.Scale());

    map.events.register('changebaselayer', map, function(e) {
        if (e.layer.mapObject) {
            e.layer.mapObject.checkResize();
            e.layer.moveTo(e.layer.map.getCenter(), e.layer.map.getZoom());
        }
    });

    var show_loc = new GeoExt.Action({
        text: "Click to Show Location",
        control: showLoc,
        map: map,
        toggleGroup: "draw",
        allowDepress: false,
        tooltip: "Click map to show location in Decimal degrees + DDMMSS",
        group: "draw"
    });


    toolbarItems = [show_loc];
    var mapPanel = new GeoExt.MapPanel({
        renderTo: 'mappanel',
        map: map,
        title: 'Map',
        extent: map.getExtent(),
        tbar:toolbarItems
    });
    map.addControl(new H.ArgParser());
    HAITI.link = new H.Permalink();
    map.addControl(HAITI.link);

    var layerTree = new Ext.tree.TreePanel({
        title: 'Map Layers',
        id: 'map_lt',
        enableDD: true,
        root: layerRoot,
        rootVisible: false,
        border: false,
        autoScroll:true,
        region:'center'
    });

    var contrib_window = new Ext.Window({
        applyTo:'contrib-div',
        layout:'fit',
        width:500,
        height:400,
        closeAction:'hide',
        plain: true,
        items: new Ext.TabPanel({
            activeTab:0,
            deferredRender:false,
            border:false,
            items: [new Ext.Panel({
                title: 'Personal',
                autoLoad: 'contrib/personal_contrib.html'
            }),new Ext.Panel({
                title: 'Corporate',
                autoLoad: 'contrib/corp_contrib.html'
            }),new Ext.Panel({
                title: 'Infrastructure',
                autoLoad: 'contrib/infra_contrib.html'
            })]
        }),

        buttons: [{
            text: 'Close',
            handler: function(){
                contrib_window.hide();
            }
        }]
    });
    ltPanel = new Ext.Panel({
        region: "center",
        title: "",
        layout: 'accordion',
        items: [layerTree]
    });
    var west = new Ext.Panel({
        region: 'west',
        id: 'west-panel',
        title:'&nbsp',
        //split:true,
        width: 300,
        minSize: 175,
        maxSize: 400,
        collapsible: true,
        margins: '0 0 0 5',
        layout: 'border',
        layoutConfig:{
            animate: true
        },

        items: [
            ltPanel,
            {
                contentEl: 'address_div',
                title: "Contributors",
                region: "south",
                border:false
            }, 
        ]
    });

    new Ext.Viewport({
        layout: "border",
        items: [{
            region: "north",
            contentEl: "title",
            height:55
        }, {
            region: "center",
            title: "",
            layout: 'fit',
            items: [mapPanel]
        }, west]
    });
    // Ext.DomHelper.append(Ext.get('title'),
    //     {tag: 'img', id: 'title_logo',src: 'images/haiti_logo_telascience.png', height: 58});

    setMapCenter();

});
