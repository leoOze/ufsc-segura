import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';

const initialRegion = {
  latitude: -27.6017,
  longitude: -48.5192,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const reportTypes = [
  {
    id: 'generic',
    title: 'Ocorrencia',
    geometry: 'marker',
    color: '#d90429',
    symbol: '!',
  },
  {
    id: 'dark-area',
    title: 'Local sem luz',
    geometry: 'polygon',
    color: '#f9c74f',
  },
];

export default function MainMap() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportLocation, setReportLocation] = useState(null);
  const [reportAreaPoints, setReportAreaPoints] = useState([]);

  const isPolygonReport = selectedReportType?.geometry === 'polygon';
  const canConfirmReport = isPolygonReport
    ? reportAreaPoints.length >= 3
    : Boolean(reportLocation);

  function startReport(type) {
    setSelectedReportType(type);
    setReportLocation(
      type.geometry === 'polygon'
        ? null
        : {
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }
    );
    setReportAreaPoints([]);
    setIsTypePickerOpen(false);
  }

  function cancelReport() {
    setReportLocation(null);
    setReportAreaPoints([]);
    setSelectedReportType(null);
    setIsReportOpen(false);
    setIsTypePickerOpen(false);
  }

  function addAreaPoint(coordinate) {
    setReportAreaPoints((currentPoints) => [...currentPoints, coordinate]);
  }

  function removeLastAreaPoint() {
    setReportAreaPoints((currentPoints) => currentPoints.slice(0, -1));
  }

  function renderReportDraft() {
    if (!selectedReportType) {
      return null;
    }

    if (selectedReportType.geometry === 'polygon') {
      return (
        <>
          {reportAreaPoints.length >= 2 && reportAreaPoints.length < 3 && (
            <Polyline
              coordinates={reportAreaPoints}
              strokeColor={selectedReportType.color}
              strokeWidth={3}
            />
          )}

          {reportAreaPoints.length >= 3 && (
            <Polygon
              coordinates={reportAreaPoints}
              strokeColor={selectedReportType.color}
              fillColor="rgba(249, 199, 79, 0.28)"
              strokeWidth={3}
            />
          )}

          {reportAreaPoints.map((point, index) => (
            <Marker
              key={`${point.latitude}-${point.longitude}-${index}`}
              coordinate={point}
            >
              <View
                style={[
                  styles.areaPointMarker,
                  { backgroundColor: selectedReportType.color },
                ]}
              >
                <Text style={styles.areaPointText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </>
      );
    }

    if (!reportLocation) {
      return null;
    }

    return (
      <Marker
        draggable
        coordinate={reportLocation}
        onDragEnd={(event) => {
          setReportLocation(event.nativeEvent.coordinate);
        }}
      >
        <View
          style={[
            styles.customMarker,
            { backgroundColor: selectedReportType.color },
          ]}
        >
          <Text style={styles.customMarkerText}>
            {selectedReportType.symbol}
          </Text>
        </View>
      </Marker>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={(event) => {
          if (!selectedReportType) {
            return;
          }

          if (selectedReportType.geometry === 'polygon') {
            addAreaPoint(event.nativeEvent.coordinate);
            return;
          }

          if (reportLocation) {
            setReportLocation(event.nativeEvent.coordinate);
          }
        }}
      >
        {renderReportDraft()}
      </MapView>

      {!isTypePickerOpen &&
        !reportLocation &&
        reportAreaPoints.length === 0 &&
        !isReportOpen && (
          <Pressable
            style={styles.reportButton}
            onPress={() => {
              setIsTypePickerOpen(true);
            }}
          >
            <Text style={styles.reportButtonText}>+</Text>
          </Pressable>
        )}

      {isTypePickerOpen && (
        <View style={styles.centerActions}>
          <View style={styles.typePicker}>
            <Text style={styles.typePickerTitle}>Tipo de report</Text>

            {reportTypes.map((type) => (
              <Pressable
                key={type.id}
                style={styles.typeButton}
                onPress={() => {
                  startReport(type);
                }}
              >
                <View
                  style={[
                    styles.typeSwatch,
                    { backgroundColor: type.color },
                  ]}
                />
                <Text style={styles.typeButtonText}>{type.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {selectedReportType && !isReportOpen && (
        <View style={styles.bottomActions}>
          <Text style={styles.pinHint}>
            {isPolygonReport
              ? `Toque no mapa para marcar a area (${reportAreaPoints.length}/3 minimo)`
              : 'Arraste o pin ou toque no mapa'}
          </Text>

          {isPolygonReport && reportAreaPoints.length > 0 && (
            <Pressable style={styles.secondaryButton} onPress={removeLastAreaPoint}>
              <Text style={styles.secondaryButtonText}>Desfazer ultimo ponto</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.confirmButton,
              !canConfirmReport && styles.disabledButton,
            ]}
            disabled={!canConfirmReport}
            onPress={() => {
              setIsReportOpen(true);
            }}
          >
            <Text style={styles.confirmButtonText}>Confirmar local</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={cancelReport}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      {isReportOpen && (
        <View style={styles.overlay}>
          <View style={styles.reportPanel}>
            <Text style={styles.reportTitle}>Novo report</Text>
            <Text style={styles.reportDescription}>
              Tipo: {selectedReportType?.title}
            </Text>
            {isPolygonReport && (
              <Text style={styles.reportDescription}>
                Pontos da area: {reportAreaPoints.length}
              </Text>
            )}

            <Pressable
              style={styles.closeButton}
              onPress={() => {
                cancelReport();
              }}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  centerActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  typePicker: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
  },

  typePickerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  typeButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  typeSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },

  typeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  bottomActions: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    left: 20,
    alignItems: 'center',
  },

  pinHint: {
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  confirmButton: {
    width: '100%',
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  cancelButton: {
    padding: 12,
    marginTop: 4,
  },

  cancelButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  reportButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reportButtonText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '600',
  },

  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d90429',
    alignItems: 'center',
    justifyContent: 'center',
  },

  customMarkerText: {
    color: '#fff',
    fontWeight: '700',
  },

  areaPointMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  areaPointText: {
    color: '#000',
    fontWeight: '700',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  reportPanel: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },

  reportTitle: {
    color: '#000',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },

  reportDescription: {
    color: '#333',
    marginBottom: 20,
  },

  closeButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
