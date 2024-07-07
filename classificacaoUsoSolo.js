// Definir um polígono aproximado para a região de Tubarão, SC
var coordenadasTubarao = [
    [-48.850000, -28.354604],
    [-48.850000, -28.564230],
    [-49.100000, -28.564230],
    [-49.100000, -28.354604]
];

// Criar a região de interesse
var tubarao = ee.Geometry.Polygon([coordenadasTubarao]);

// Adicionar a região de interesse ao mapa
Map.centerObject(tubarao, 10);
Map.addLayer(tubarao, {color: 'blue'}, 'Área de Tubarão');

// Carregar imagens do Landsat 8 para a região de Tubarão durante um período específico
var colecaoImagens = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
    .filterBounds(tubarao)
    .filterDate('2020-01-01', '2020-12-31')
    .sort('CLOUD_COVER');

// Selecionar a imagem com menor cobertura de nuvens e recortar pela área de interesse
var imagem = ee.Image(colecaoImagens.first()).clip(tubarao);

// Visualizar a imagem no mapa
Map.addLayer(imagem, {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 0.3,
    gamma: 1.4
}, 'Visualização Landsat 8');

// Criar amostras de treinamento manualmente para cada categoria de uso do solo
var amostrasConstruida = ee.FeatureCollection([
    ee.Feature(ee.Geometry.Point([-48.970000, -28.474604]), {'landcover': 0}),
    ee.Feature(ee.Geometry.Point([-48.980000, -28.464230]), {'landcover': 0})
]);

var amostrasMineracao = ee.FeatureCollection([
    ee.Feature(ee.Geometry.Point([-49.000000, -28.484604]), {'landcover': 1}),
    ee.Feature(ee.Geometry.Point([-48.990000, -28.494230]), {'landcover': 1})
]);

var amostrasPastagens = ee.FeatureCollection([
    ee.Feature(ee.Geometry.Point([-48.960000, -28.484604]), {'landcover': 2}),
    ee.Feature(ee.Geometry.Point([-48.950000, -28.474230]), {'landcover': 2})
]);

var amostrasVegetacao = ee.FeatureCollection([
    ee.Feature(ee.Geometry.Point([-48.930000, -28.464604]), {'landcover': 3}),
    ee.Feature(ee.Geometry.Point([-48.920000, -28.454230]), {'landcover': 3})
]);

var amostrasCulturas = ee.FeatureCollection([
    ee.Feature(ee.Geometry.Point([-48.910000, -28.444604]), {'landcover': 4}),
    ee.Feature(ee.Geometry.Point([-48.900000, -28.434230]), {'landcover': 4})
]);

// Unir todas as amostras em um único FeatureCollection
var amostrasTreinamento = amostrasConstruida.merge(amostrasMineracao)
                                           .merge(amostrasPastagens)
                                           .merge(amostrasVegetacao)
                                           .merge(amostrasCulturas);

// Selecionar bandas adequadas para classificação
var bandas = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

// Extrair as bandas de interesse para o treinamento
var treinamento = imagem.select(bandas).sampleRegions({
  collection: amostrasTreinamento,
  properties: ['landcover'],
  scale: 30
});

// Treinar um classificador Random Forest
var classificador = ee.Classifier.smileRandomForest(50).train({
  features: treinamento,
  classProperty: 'landcover',
  inputProperties: bandas
});

// Classificar a imagem
var imagemClassificada = imagem.classify(classificador);

// Definir a paleta de cores para cada categoria de uso do solo
var paleta = ['red', 'blue', 'green', 'brown', 'yellow'];

// Visualizar a classificação no mapa
Map.addLayer(imagemClassificada, {min: 0, max: 4, palette: paleta}, 'Classificação de Uso do Solo');