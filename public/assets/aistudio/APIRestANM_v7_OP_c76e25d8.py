import arcpy
import urllib.request
import urllib.parse
import json
import os
import re
import unicodedata
from datetime import datetime
import pandas as pd

# ==============================================================================
# 1. ENTRADA DINÁMICA: SHAPEFILE LOCAL O CONSULTA WEB POR PLACA
# ==============================================================================
directorio_base = r"C:\Users\jorge\Desktop"

print("=" * 75)
entrada_usuario = input("Ingrese la PLACA/EXPEDIENTE (ej: DLK-113, FG2-083, IJN-11331) o RUTA SHP: ").strip()
print("=" * 75 + "\n")

sufijo_tiempo = datetime.now().strftime("%Y%m%d_%H%M%S")
headers_http = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

sr_ctm12 = arcpy.SpatialReference(9377)
sr_wgs84 = arcpy.SpatialReference(4326)

# ==============================================================================
# 2. DESCARGA AUTOMÁTICA EN TENURE LAYERS (SI NO HAY SHP LOCAL)
# ==============================================================================
def descargar_poligono_anm_por_placa(placa_codigo, carpeta_destino):
    raw_code = placa_codigo.strip().upper()
    clean_code = re.sub(r'[^A-Z0-9]', '', raw_code)
    url_tenure = "https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer"
    
    print(f"[*] Buscando expediente/placa '{raw_code}' en TenureLayers...", flush=True)

    keywords_campo = ["CODIGO", "EXPEDIENTE", "TITULO", "SOLICITUD", "PLACA", "NUMERO", "COD", "ID"]
    
    try:
        req_info = urllib.request.Request(f"{url_tenure}?f=json", headers=headers_http)
        resp_info = urllib.request.urlopen(req_info)
        info_serv = json.loads(resp_info.read())
        
        capas = info_serv.get("layers") or []
        lista_capas_evaluar = capas if len(capas) > 0 else [{"id": i, "name": f"Capa_{i}"} for i in range(11)]
        
        for capa in lista_capas_evaluar:
            if capa.get("subLayerIds") is not None and len(capa.get("subLayerIds")) > 0:
                continue

            layer_id = capa["id"]
            layer_name = capa.get("name", f"Capa_{layer_id}")
            
            campos_validos = []
            try:
                req_meta = urllib.request.Request(f"{url_tenure}/{layer_id}?f=json", headers=headers_http)
                resp_meta = urllib.request.urlopen(req_meta)
                layer_meta = json.loads(resp_meta.read())
                campos_capa = layer_meta.get("fields") or []
                
                campos_validos = [
                    f["name"] for f in campos_capa 
                    if isinstance(f, dict) and f.get("type") in ["esriFieldTypeString", "esriFieldTypeOID"]
                    and any(kw in str(f.get("name", "")).upper() for kw in keywords_campo)
                ]
            except Exception:
                campos_validos = ["CODIGO_EXP", "SOLICITUD", "TITULO", "PLACA", "CODIGO", "NUMERO_TITULO", "NUM_SOLICITUD"]

            if not campos_validos:
                continue

            or_conditions = []
            for campo in campos_validos:
                or_conditions.append(f"UPPER({campo}) LIKE '%{raw_code}%'")
                if clean_code != raw_code:
                    or_conditions.append(f"UPPER({campo}) LIKE '%{clean_code}%'")
            
            where_clause = " OR ".join(or_conditions)

            parametros = {
                "where": where_clause,
                "outFields": "*",
                "returnGeometry": "true",
                "outSR": "9377",
                "f": "json"
            }
            
            url_query = f"{url_tenure}/{layer_id}/query"
            datos_codificados = urllib.parse.urlencode(parametros).encode("utf-8")
            req = urllib.request.Request(url_query, data=datos_codificados, headers=headers_http)
            
            try:
                respuesta = urllib.request.urlopen(req)
                json_data = json.loads(respuesta.read())
                features = json_data.get("features") or []
                
                if len(features) > 0:
                    print(f"  [+] ¡Geometría encontrada en '{layer_name}' (Capa {layer_id})! ({len(features)} registro/s).", flush=True)
                    
                    clean_filename = re.sub(r'[^a-zA-Z0-9_]', '_', raw_code)
                    json_temp = os.path.join(carpeta_destino, f"temp_base_{clean_filename}.json")
                    with open(json_temp, "w", encoding="utf-8") as f:
                        json.dump(json_data, f)
                    
                    fc_descargado = os.path.join(carpeta_destino, f"Base_{clean_filename}.shp")
                    arcpy.conversion.JSONToFeatures(json_temp, fc_descargado)
                    
                    if os.path.exists(json_temp):
                        os.remove(json_temp)
                        
                    return fc_descargado, clean_filename
            except Exception:
                continue
    except Exception as e:
        print(f"[!] Error de conexión con TenureLayers: {e}", flush=True)
            
    raise ValueError(f"No se encontró el expediente/placa '{placa_codigo}' en el servicio TenureLayers de la ANM.")

# ==============================================================================
# 3. CONFIGURACIÓN DE RUTAS Y GEODATABASE
# ==============================================================================
if entrada_usuario.endswith(".shp") and os.path.exists(entrada_usuario):
    capa_origen = entrada_usuario
    app_code_backup = os.path.splitext(os.path.basename(capa_origen))[0]
    ruta_carpeta_raiz = os.path.join(os.path.dirname(capa_origen), f"{app_code_backup}_{sufijo_tiempo}")
    os.makedirs(ruta_carpeta_raiz, exist_ok=True)
else:
    app_code_backup = re.sub(r'[^a-zA-Z0-9_]', '_', entrada_usuario.upper())
    ruta_carpeta_raiz = os.path.join(directorio_base, f"{app_code_backup}_{sufijo_tiempo}")
    os.makedirs(ruta_carpeta_raiz, exist_ok=True)
    capa_origen, app_code_backup = descargar_poligono_anm_por_placa(entrada_usuario, ruta_carpeta_raiz)

nombre_gdb = f"Resultados_{app_code_backup}_{sufijo_tiempo}.gdb"
gdb_salida = os.path.join(ruta_carpeta_raiz, nombre_gdb)
nombre_dataset = "Recortes_Afectaciones"
ruta_excel = os.path.join(ruta_carpeta_raiz, f"{app_code_backup}_Reporte_Afectaciones_{sufijo_tiempo}.xlsx")

arcpy.management.CreateFileGDB(ruta_carpeta_raiz, nombre_gdb)
ruta_dataset = os.path.join(gdb_salida, nombre_dataset)
arcpy.management.CreateFeatureDataset(gdb_salida, nombre_dataset, sr_ctm12)

arcpy.env.workspace = gdb_salida
arcpy.env.outputCoordinateSystem = sr_ctm12
arcpy.env.overwriteOutput = True

# ==============================================================================
# 4. REPROYECCIÓN A CTM12 Y GENERACIÓN DE ENVELOPE EN WGS84 (4326)
# ==============================================================================
capa_solicitud = os.path.join(ruta_dataset, "Solicitud_Evaluada_9377")
desc_in = arcpy.Describe(capa_origen)

if desc_in.spatialReference and desc_in.spatialReference.name != "Unknown":
    print(f"[*] Estandarizando proyección del SHP base ('{desc_in.spatialReference.name}') a CTM12 (EPSG 9377)...", flush=True)
    arcpy.management.Project(capa_origen, capa_solicitud, sr_ctm12)
else:
    print("[!] ADVERTENCIA: SHP sin proyección definida. Asignando CTM12 (EPSG 9377)...", flush=True)
    arcpy.management.CopyFeatures(capa_origen, capa_solicitud)
    arcpy.management.DefineProjection(capa_solicitud, sr_ctm12)

# BBOX en WGS84 (4326) con formato Esri JSON estricto
capa_temp_wgs84 = os.path.join(gdb_salida, "temp_solicitud_4326")
arcpy.management.Project(capa_solicitud, capa_temp_wgs84, sr_wgs84)
ext_4326 = arcpy.Describe(capa_temp_wgs84).extent
geom_query_json = json.dumps({
    "xmin": ext_4326.XMin,
    "ymin": ext_4326.YMin,
    "xmax": ext_4326.XMax,
    "ymax": ext_4326.YMax,
    "spatialReference": {"wkid": 4326}
})
arcpy.management.Delete(capa_temp_wgs84)

# ==============================================================================
# 5. EXTRACCIÓN DE METADATOS Y ÁREA OFICIAL CON CONTROL DE VACÍOS
# ==============================================================================
def extraer_metadatos_solicitud(capa, nombre_defecto):
    fecha_defecto = "No Registrada"
    clasificacion_defecto = "No Especificada"
    
    campos = arcpy.ListFields(capa)
    nombres_campos = [f.name for f in campos]
    
    campo_nombre = next((f for f in nombres_campos if any(p in f.upper() for p in ["CODIGO_EXP", "SOLICITUD", "PLACA", "CODIGO", "EXPEDIENTE", "NUM_SOLI"])), None)
    campo_fecha = next((f for f in nombres_campos if any(p in f.upper() for p in ["FECHA_DE_SOLICITUD", "FECHA_DE_S", "FECHA", "FEC_SOL", "DATE"])), None)
    campo_clasif = next((f for f in nombres_campos if any(p in f.upper() for p in ["CLASIFICACION_MINERIA", "CLASIFICAC", "MINING_CLA"])), None)

    val_nombre, val_fecha, val_clasif = "", fecha_defecto, clasificacion_defecto
    
    with arcpy.da.SearchCursor(capa, nombres_campos) as cursor:
        for row in cursor:
            if campo_nombre and row[nombres_campos.index(campo_nombre)] is not None:
                txt_n = str(row[nombres_campos.index(campo_nombre)]).strip()
                if txt_n: val_nombre = txt_n
            if campo_fecha and row[nombres_campos.index(campo_fecha)] is not None:
                v_f = row[nombres_campos.index(campo_fecha)]
                if isinstance(v_f, datetime):
                    val_fecha = v_f.strftime("%d/%b/%Y")
                elif str(v_f).strip():
                    val_fecha = str(v_f).strip()
            if campo_clasif and row[nombres_campos.index(campo_clasif)] is not None:
                v_c = str(row[nombres_campos.index(campo_clasif)]).strip().upper()
                if any(k in v_c for k in ["PEQ", "PEQUEÑA", "PMA"]): val_clasif = "Pequeña"
                elif any(k in v_c for k in ["MED", "MEDIANA", "PMM"]): val_clasif = "Mediana"
                elif any(k in v_c for k in ["GRA", "GRANDE", "PMG"]): val_clasif = "Grande"
                elif v_c: val_clasif = v_c
            break
            
    if not val_nombre:
        val_nombre = nombre_defecto

    return val_nombre, val_fecha, val_clasif

def obtener_area_oficial_anm(capa):
    campos = [f.name for f in arcpy.ListFields(capa)]
    candidatos_area = ["AreaTot_Ha", "AREA_HA", "AREA", "HECTARES", "HECTAREAS", "AREA_OFICI", "AREA_TOT", "Shape_Area"]
    campo_area = next((f for cand in candidatos_area for f in campos if cand.upper() in f.upper()), None)
    
    area_val = 0.0
    if campo_area:
        with arcpy.da.SearchCursor(capa, [campo_area]) as cursor:
            for row in cursor:
                if row[0] is not None:
                    val = float(row[0])
                    if val > 100000: val /= 10000.0
                    area_val += val
                    
    if area_val == 0.0:
        with arcpy.da.SearchCursor(capa, ["SHAPE@AREA"]) as cursor:
            for row in cursor:
                area_val += row[0] / 10000.0

    return area_val

app_code, app_date, app_scale = extraer_metadatos_solicitud(capa_solicitud, app_code_backup)
area_total = obtener_area_oficial_anm(capa_solicitud)

if app_scale == "No Especificada":
    if area_total <= 150: app_scale = "Pequeña"
    elif area_total <= 5000: app_scale = "Mediana"
    else: app_scale = "Grande"

campos_solicitud_set = set(f.name.upper() for f in arcpy.ListFields(capa_solicitud))

print("=" * 75, flush=True)
print(f" EXPEDIENTE / PLACA:       {app_code}", flush=True)
print(f" FECHA DE RADICACIÓN:       {app_date}", flush=True)
print(f" CLASIFICACIÓN MINERA:     {app_scale}", flush=True)
print(f" ÁREA OFICIAL REGISTRADA:  {area_total:.4f} Ha", flush=True)
print(f" CARPETA ENTREGABLE:       {ruta_carpeta_raiz}", flush=True)
print("=" * 75 + "\n", flush=True)

# ==============================================================================
# 6. MOTOR DE CLASIFICACIÓN RIGUROSO NORMATIVO MINERO-AMBIENTAL COLOMBIANO
# ==============================================================================
def evaluar_nivel_riesgo_layer(layer_name_raw):
    l_up = layer_name_raw.upper()

    criticos = [
        "TITULO VIGENTE", "TÍTULO VIGENTE", "SOLICITUD VIGENTE",
        "PARQUE NACIONAL", "PARQUES NACIONALES", "PÁRAMO", "PARAMO",
        "BOSQUE SECO TROPICAL", "RAMSAR", "HUMEDAL",
        "RESTRINGIDA", "RESTRICTED", "EXCLUSIVE_RESTRICTION",
        "RESGUARDO", "INDIGENA", "INDÍGENA", "COMUNIDAD NEGRA", "CONSEJO COMUNITARIO",
        "RESTITUCION", "RESTITUCIÓN", "PREDIO RESTITUCION", "ZONA EXCLUIDA"
    ]
    if any(k in l_up for k in criticos):
        return "CRÍTICO (ALERTA MÁXIMA)", "CRIT"

    altos = [
        "LEY SEGUNDA", "LEY 2DA", "LEY 2A", "RESERVA FORESTAL",
        "BIOSFERA", "BIÓSFERA", "DMI", "DISTRITO DE MANEJO",
        "PROYECTO LICENCIADO", "MICROFOCALIZADA", "MACROFOCALIZADA",
        "RUNAP", "SRAM", "RESERVA NATURAL"
    ]
    if any(k in l_up for k in altos):
        return "ALTO (SOCIAL / AMBIENTAL / SUSTRACCIÓN)", "ALTO"

    medios = [
        "RESERVA ESPECIAL", "ZONA MINERA ESPECIAL", "AGRÍCOLA", "AGRICOLA",
        "GANADERA", "DRAINAGE", "DRAIN", "DRENAJE", "RONDA HÍDRICA"
    ]
    if any(k in l_up for k in medios):
        return "MEDIO (MANEJO / PERMISOS)", "MED"

    return "INFORMATIVO / BASE", "INFO"

def mapear_prefijo_servicio(nombre_servicio):
    mapa = {"General_Base": "CGBase", "Cuadricula": "CCuadricula", "TenureLayers": "CTenureLayers", "Exclusive_Restriction": "CExclusive_Restriction"}
    return mapa.get(nombre_servicio, f"C_{nombre_servicio}")

def limpiar_nombre_raw(texto):
    texto_normalizado = unicodedata.normalize('NFD', texto).encode('ascii', 'ignore').decode("utf-8")
    texto_limpio = re.sub(r'[^a-zA-Z0-9_]', '_', texto_normalizado)
    return re.sub(r'_+', '_', texto_limpio).strip('_')

def obtener_campo_nombre_texto(capa_cruce, campos_exclusion, layer_name_raw=""):
    campos = arcpy.ListFields(capa_cruce)
    bloqueo_tecnico = ["SCHEMA_NAME", "SCHEMA", "SOURCE_TABLE", "SOURCE_INFO", "OBJECTID", "FID", "SHAPE", "SHAPE_LENGTH", "SHAPE_AREA", "FEATURE_CLASS"]
    
    campos_texto = [f for f in campos if f.type == "String" and f.name.upper() not in bloqueo_tecnico]
    campos_anm = [f for f in campos_texto if f.name.upper() not in campos_exclusion]
    if not campos_anm: campos_anm = campos_texto

    layer_upper = layer_name_raw.upper()

    if any(k in layer_upper for k in ["RESTRINGIDA", "LICENCIADO", "EXCLUSIVE", "RESTITUCION"]):
        candidatos_id = ["RESTRICTION_UNIQUE_ID", "FEATURE_CLASS_PK", "RESTRICTION_POLY_ID", "ID", "EXPEDIENTE", "NUM_ACTO", "RESOLUCION", "CODIGO"]
        for cand in candidatos_id:
            for f in campos_anm:
                if f.name.upper() == cand:
                    return f.name

    if "DEPARTAMENTO" in layer_upper: prioritarias = ["NOM_DEPARTAMENTO", "NOM_DEP", "NOMB_DEP", "NOMBRE_DEPTO", "DEPARTAMENTO", "DPTO_CNMBR", "NOMBRE"]
    elif "MUNICIPIO" in layer_upper: prioritarias = ["NOM_MUNICIPIO", "NOM_MUN", "NOMB_MUN", "NOMBRE_MPIO", "MUNICIPIO", "MPIO_CNMBR", "NOMBRE"]
    elif "VEREDA" in layer_upper: prioritarias = ["NOM_VEREDA", "NOM_VER", "NOMB_VER", "NOMBRE_VEREDA", "VEREDA", "NOMBRE"]
    else: prioritarias = ["RESTRICTION_UNIQUE_ID", "FEATURE_CLASS_PK", "ID", "EXPEDIENTE", "NUM_ACTO", "RESOLUCION", "TITULO", "NOMBRE", "NOMB", "LABEL", "DESCRIP"]

    for prio in prioritarias:
        for f in campos_anm:
            fn = f.name.upper()
            if fn == prio or (prio in fn and not any(bad in fn for bad in ["COD_", "DIVIPOLA", "SCHEMA", "TABLE"])):
                with arcpy.da.SearchCursor(capa_cruce, [f.name]) as cur_chk:
                    for r_chk in cur_chk:
                        val_str = str(r_chk[0]).strip() if r_chk[0] is not None else ""
                        if val_str and not val_str.isdigit() and "SIGM_" not in val_str:
                            return f.name

    for f in campos_anm:
        fn = f.name.upper()
        if not any(bad in fn for bad in ["COD", "DIVIPOLA", "SCHEMA", "TABLE"]):
            with arcpy.da.SearchCursor(capa_cruce, [f.name]) as cur_chk:
                for r_chk in cur_chk:
                    val_str = str(r_chk[0]).strip() if r_chk[0] is not None else ""
                    if val_str and not val_str.isdigit() and "SIGM_" not in val_str:
                        return f.name

    return campos_anm[0].name if campos_anm else None

matriz_ejecutiva_dict = {
    "Item": 1, "Application": app_code, "Clasificación Minera": app_scale,
    "Municipios": [], "Veredas": [], "Department": [],
    "Corredor Grid - Existe": "No", "Corredor Grid - Propiedad": "No",
    "Date application": app_date, 
    "Grid (Ha)": round(area_total, 4),
    "Calculated after request (Ha)": round(area_total, 4), 
    "Recortes (Ha)": round(area_total, 4),
    "Title Holder by ANM": "Sin Titular Exclusivo",
    "Zonas Prohibidas": "No", "Zonas Prohibidas - Tipo": "N.A", "Zonas Prohibidas - %": "N.A",
    "Zonas Restringidas y/o Protegidas": "No", "Zonas Restringidas - Tipo": "N.A", "Zonas Restringidas - %": "N.A",
    "Reserva Forestal": "No", "Reserva Forestal - Tipo": "N.A", "Reserva Forestal - %": "N.A",
    "Zonas Minería Especial": "No", "Zonas Minería Especial - Tipo": "N.A", "Zonas Minería Especial - %": "N.A",
    "Comunidades Étnicas": "No", "Comunidades Étnicas - Tipo": "N.A", "Comunidades Étnicas - %": "N.A"
}

servicios_rest = [
    "https://annamineria.anm.gov.co/annageo/rest/services/SIGM/General_Base/MapServer",
    "https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Cuadricula/MapServer",
    "https://annamineria.anm.gov.co/annageo/rest/services/SIGM/TenureLayers/MapServer",
    "https://annamineria.anm.gov.co/annageo/rest/services/SIGM/Exclusive_Restriction/MapServer"
]

matriz_resumen, detalle_territorial, detalle_general_capas = [], [], []
area_restriccion_dura = 0.0

campo_area_cruce = "AreaCruce_Ha"
campo_porcentaje = "Porcentaje_Afectacion"
campo_longitud = "Longitud_Km"

# ==============================================================================
# 7. GEOPROCESAMIENTO Y CONSULTAS ESPACIALES CORREGIDAS
# ==============================================================================
for url_servicio in servicios_rest:
    partes_url = url_servicio.split("/")
    nombre_raw_serv = partes_url[-2] if partes_url[-1] == "MapServer" else partes_url[-1]
    prefijo_serv_largo = limpiar_nombre_raw(nombre_raw_serv)
    prefijo_serv_corto = mapear_prefijo_servicio(nombre_raw_serv)

    print(f"--> CONSULTANDO SERVICIO: {prefijo_serv_largo} ({prefijo_serv_corto})", flush=True)

    try:
        req_info = urllib.request.Request(f"{url_servicio}?f=json", headers=headers_http)
        resp_info = urllib.request.urlopen(req_info)
        info_servicio = json.loads(resp_info.read())
        capas = info_servicio.get("layers") or []

        for capa in capas:
            # OMITIR CAPAS DE GRUPO (No contienen entidades)
            if capa.get("subLayerIds") is not None and len(capa.get("subLayerIds")) > 0:
                continue

            layer_id = capa["id"]
            layer_name_raw = capa["name"]
            nombre_capa_limpio = limpiar_nombre_raw(layer_name_raw)

            nivel_riesgo, tag_riesgo = evaluar_nivel_riesgo_layer(layer_name_raw)

            nombre_fc_gdb = f"{prefijo_serv_corto}_{nombre_capa_limpio}_{tag_riesgo}"

            capa_descargada = os.path.join(gdb_salida, f"Raw_{prefijo_serv_largo}_{nombre_capa_limpio}")
            capa_temp_intersect = os.path.join(gdb_salida, f"Temp_{prefijo_serv_largo}_{nombre_capa_limpio}")
            capa_final_cruce = os.path.join(ruta_dataset, nombre_fc_gdb)

            # PARÁMETROS CORREGIDOS CON ESTRUCTURA JSON Y EPSG 4326 UNIVERSAL
            parametros = {
                "where": "1=1",
                "geometry": geom_query_json,
                "geometryType": "esriGeometryEnvelope",
                "spatialRel": "esriSpatialRelIntersects",
                "inSR": "4326",
                "outSR": "9377",
                "outFields": "*",
                "returnGeometry": "true",
                "f": "json"
            }

            url_query = f"{url_servicio}/{layer_id}/query"
            datos_codificados = urllib.parse.urlencode(parametros).encode("utf-8")
            req_query = urllib.request.Request(url_query, data=datos_codificados, headers=headers_http)

            try:
                respuesta = urllib.request.urlopen(req_query)
                json_data = json.loads(respuesta.read())
                features = json_data.get("features") or []

                if len(features) > 0:
                    json_temp = os.path.join(ruta_carpeta_raiz, "temp_anm.json")
                    with open(json_temp, "w", encoding="utf-8") as f:
                        json.dump(json_data, f)

                    arcpy.conversion.JSONToFeatures(json_temp, capa_descargada)

                    if arcpy.Exists(capa_descargada):
                        arcpy.analysis.PairwiseIntersect([capa_solicitud, capa_descargada], capa_temp_intersect)
                        
                        if arcpy.Exists(capa_temp_intersect) and int(arcpy.management.GetCount(capa_temp_intersect)[0]) > 0:
                            tipos_validos = ["String", "Integer", "SmallInteger", "Double", "Single", "Date"]
                            campos_mantener = [f.name for f in arcpy.ListFields(capa_temp_intersect) if f.type in tipos_validos]

                            arcpy.analysis.PairwiseDissolve(capa_temp_intersect, capa_final_cruce, dissolve_field=campos_mantener, multi_part="MULTI_PART")

                            desc_cruce = arcpy.Describe(capa_final_cruce)
                            tipo_geom = desc_cruce.shapeType
                            campo_nombre_texto = obtener_campo_nombre_texto(capa_final_cruce, campos_solicitud_set, layer_name_raw)

                            if tipo_geom == "Polygon":
                                arcpy.management.CalculateGeometryAttributes(in_features=capa_final_cruce, geometry_property=[[campo_area_cruce, "AREA"]], area_unit="HECTARES")
                                area_cruce_total = sum(r[0] for r in arcpy.da.SearchCursor(capa_final_cruce, [campo_area_cruce]) if r[0])
                                pct_raw = (area_cruce_total / area_total) * 100.0
                                pct_total = 100.00 if (pct_raw >= 99.8 or abs(area_cruce_total - area_total) < 2.0) else pct_raw

                                arcpy.management.CalculateField(in_table=capa_final_cruce, field=campo_porcentaje, expression=f"(!{campo_area_cruce}! / {area_total}) * 100", expression_type="PYTHON3", field_type="DOUBLE")

                                matriz_resumen.append({
                                    "Servicio REST": prefijo_serv_largo, "Capa ANM": layer_name_raw,
                                    "Nivel de Atención": nivel_riesgo, "Tipo Geometría": "Polígono",
                                    "Extensión Afectada (Ha)": round(area_cruce_total if pct_total < 100.00 else area_total, 4),
                                    "Porcentaje Afectación (%)": round(pct_total, 2), "Longitud Afectada (Km)": "N/A"
                                })

                                exp_extraido = "Detectado"
                                if campo_nombre_texto:
                                    with arcpy.da.SearchCursor(capa_final_cruce, [campo_nombre_texto]) as c_exp:
                                        for r_e in c_exp:
                                            if r_e[0] and str(r_e[0]).strip() != "":
                                                exp_extraido = str(r_e[0]).strip()
                                                break

                                l_raw_up = layer_name_raw.upper()

                                if any(k in l_raw_up for k in ["TÍTULO VIGENTE", "TITULO VIGENTE", "PARQUE NACIONAL", "PÁRAMO", "PARAMO", "BOSQUE SECO TROPICAL", "RAMSAR"]):
                                    area_restriccion_dura += area_cruce_total
                                    if "TÍTULO" in l_raw_up or "TITULO" in l_raw_up:
                                        matriz_ejecutiva_dict["Title Holder by ANM"] = exp_extraido
                                    matriz_ejecutiva_dict["Zonas Prohibidas"] = exp_extraido
                                    matriz_ejecutiva_dict["Zonas Prohibidas - Tipo"] = layer_name_raw
                                    matriz_ejecutiva_dict["Zonas Prohibidas - %"] = f"{pct_total:.2f}%"

                                elif any(k in l_raw_up for k in ["RESTRINGIDA", "LICENCIADO", "EXCLUSIVE"]):
                                    area_restriccion_dura += area_cruce_total
                                    matriz_ejecutiva_dict["Zonas Restringidas y/o Protegidas"] = exp_extraido
                                    matriz_ejecutiva_dict["Zonas Restringidas - Tipo"] = layer_name_raw
                                    matriz_ejecutiva_dict["Zonas Restringidas - %"] = f"{pct_total:.2f}%"

                                elif any(k in l_raw_up for k in ["LEY SEGUNDA", "LEY 2DA", "LEY 2A", "RESERVA FORESTAL", "BIOSFERA", "BIÓSFERA"]):
                                    matriz_ejecutiva_dict["Reserva Forestal"] = exp_extraido
                                    matriz_ejecutiva_dict["Reserva Forestal - Tipo"] = layer_name_raw
                                    matriz_ejecutiva_dict["Reserva Forestal - %"] = f"{pct_total:.2f}%"

                                elif any(k in l_raw_up for k in ["RESGUARDO", "INDIGENA", "INDÍGENA", "COMUNIDAD NEGRA", "RESTITUCION", "RESTITUCIÓN"]):
                                    matriz_ejecutiva_dict["Comunidades Étnicas"] = exp_extraido
                                    matriz_ejecutiva_dict["Comunidades Étnicas - Tipo"] = layer_name_raw
                                    matriz_ejecutiva_dict["Comunidades Étnicas - %"] = f"{pct_total:.2f}%"

                                elif any(k in l_raw_up for k in ["RESERVA ESPECIAL", "ZONA MINERA ESPECIAL"]):
                                    matriz_ejecutiva_dict["Zonas Minería Especial"] = exp_extraido
                                    matriz_ejecutiva_dict["Zonas Minería Especial - Tipo"] = layer_name_raw
                                    matriz_ejecutiva_dict["Zonas Minería Especial - %"] = f"{pct_total:.2f}%"

                                if campo_nombre_texto:
                                    with arcpy.da.SearchCursor(capa_final_cruce, [campo_nombre_texto, campo_area_cruce]) as c_det:
                                        for r_det in c_det:
                                            val_txt = str(r_det[0]) if r_det[0] is not None else "Sin Nombre"
                                            area_item = float(r_det[1]) if r_det[1] is not None else 0.0
                                            pct_item = (area_item / area_total) * 100.0

                                            if layer_name_raw == "Municipio":
                                                matriz_ejecutiva_dict["Municipios"].append(f"{val_txt} ({pct_item:.2f}%)")
                                            elif layer_name_raw == "Vereda":
                                                matriz_ejecutiva_dict["Veredas"].append(f"{val_txt} ({pct_item:.2f}%)")
                                            elif layer_name_raw == "Departamento":
                                                matriz_ejecutiva_dict["Department"].append(f"{val_txt} ({pct_item:.2f}%)")

                                            registro_detalle = {
                                                "Capa Categoria": layer_name_raw, "Nombre Especifico / Entidad": val_txt,
                                                "Área Afectada (Ha)": round(area_item, 4), "Afectación (%)": round(pct_item, 2)
                                            }
                                            if layer_name_raw in ["Municipio", "Vereda", "Departamento"]:
                                                detalle_territorial.append(registro_detalle)
                                            else:
                                                detalle_general_capas.append(registro_detalle)

                                print(f"  [!] FC CREADO ({tag_riesgo}): {nombre_fc_gdb} | {area_cruce_total:.4f} Ha ({pct_total:.2f}%)", flush=True)

                            elif tipo_geom == "Polyline":
                                arcpy.management.CalculateGeometryAttributes(in_features=capa_final_cruce, geometry_property=[[campo_longitud, "LENGTH_GEODESIC"]], length_unit="KILOMETERS")
                                km_total = sum(r[0] for r in arcpy.da.SearchCursor(capa_final_cruce, [campo_longitud]) if r[0])

                                matriz_resumen.append({
                                    "Servicio REST": prefijo_serv_largo, "Capa ANM": layer_name_raw,
                                    "Nivel de Atención": nivel_riesgo, "Tipo Geometría": "Línea",
                                    "Extensión Afectada (Ha)": "N/A", "Porcentaje Afectación (%)": "N/A", "Longitud Afectada (Km)": round(km_total, 4)
                                })
                                print(f"  [!] FC CREADO LINEAL ({tag_riesgo}): {nombre_fc_gdb} | {km_total:.4f} Km", flush=True)

                        for tmp in [capa_descargada, capa_temp_intersect]:
                            if arcpy.Exists(tmp): arcpy.management.Delete(tmp)
                    else:
                        for tmp in [capa_descargada, capa_temp_intersect]:
                            if arcpy.Exists(tmp): arcpy.management.Delete(tmp)

                    if os.path.exists(json_temp): os.remove(json_temp)

            except Exception as e_layer:
                print(f"  [x] Error procesando [{layer_name_raw}]: {e_layer}", flush=True)

    except Exception as e_serv:
        print(f"[x] Error conectando al servicio {prefijo_serv_largo}: {e_serv}\n", flush=True)

# ==============================================================================
# 8. CONSOLIDACIÓN Y EXPORTACIÓN A EXCEL
# ==============================================================================
matriz_ejecutiva_dict["Municipios"] = ", ".join(matriz_ejecutiva_dict["Municipios"]) if matriz_ejecutiva_dict["Municipios"] else "No Identificado"
matriz_ejecutiva_dict["Veredas"] = ", ".join(matriz_ejecutiva_dict["Veredas"]) if matriz_ejecutiva_dict["Veredas"] else "No Identificado"
matriz_ejecutiva_dict["Department"] = ", ".join(matriz_ejecutiva_dict["Department"]) if matriz_ejecutiva_dict["Department"] else "No Identificado"
matriz_ejecutiva_dict["Recortes (Ha)"] = round(area_total - area_restriccion_dura, 4)

df_ejecutiva = pd.DataFrame([matriz_ejecutiva_dict])
df_resumen = pd.DataFrame(matriz_resumen)
df_territorio = pd.DataFrame(detalle_territorial)
df_capas_detalle = pd.DataFrame(detalle_general_capas)

print("\n--> Exportando informe completo a Excel...", flush=True)
with pd.ExcelWriter(ruta_excel, engine='openpyxl') as writer:
    df_ejecutiva.to_excel(writer, sheet_name='Matriz_Ejecutiva_ANM', index=False)
    df_resumen.to_excel(writer, sheet_name='Matriz_Afectaciones', index=False)
    if not df_territorio.empty:
        df_territorio.to_excel(writer, sheet_name='Desglose_Territorial', index=False)
    if not df_capas_detalle.empty:
        df_capas_detalle.to_excel(writer, sheet_name='Detalle_Otras_Capas', index=False)

print("=" * 75, flush=True)
print(f" AUDITORÍA FINALIZADA EXITOSAMENTE PARA {app_code}", flush=True)
print(f" Carpeta contenedora: {ruta_carpeta_raiz}", flush=True)
print("=" * 75, flush=True)
