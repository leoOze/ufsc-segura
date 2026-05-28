import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  createReport,
  downvoteReport,
  getReports,
  upvoteReport,
} from '../../services/api';
import multer from 'multer';

const defaultRegion = {
  latitude: -27.6017,
  longitude: -48.5192,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
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

function coordinateToGeoJsonPoint(coordinate) {
  return [coordinate.longitude, coordinate.latitude];
}

function geoJsonPointToCoordinate(coordinates) {
  return {
    latitude: coordinates[1],
    longitude: coordinates[0],
  };
}

function areaPointsToGeoJsonPolygon(points) {
  const coordinates = points.map(coordinateToGeoJsonPoint);
  coordinates.push(coordinateToGeoJsonPoint(points[0]));
  return [coordinates];
}

function geoJsonPolygonToCoordinates(coordinates) {
  return coordinates[0].map(geoJsonPointToCoordinate);
}

export default function MainMap() {
  const [region, setRegion] = useState(defaultRegion);
  const [reports, setReports] = useState([]);
  const [selectedBackendReport, setSelectedBackendReport] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotoUrl, setReportPhotoUrl] = useState('');
  const [reportLocation, setReportLocation] = useState(null);
  const [reportAreaPoints, setReportAreaPoints] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);

  useEffect(() => {
    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.warn('A permissao de localizacao foi negada');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.warn('Nao foi possivel obter a localizacao', error);
      }
    }

    getLocation();
  }, []);

  useEffect(() => {
    loadReports();
  }, []);

  const isPolygonReport = selectedReportType?.geometry === 'polygon';
  const canConfirmReport = isPolygonReport
    ? reportAreaPoints.length >= 3
    : Boolean(reportLocation);

  async function loadReports() {
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function startReport(type) {
    setErrorMessage('');
    setSelectedBackendReport(null);
    setSelectedReportType(type);
    setReportTitle(type.title);
    setReportDescription('');
    setReportPhotoUrl('');
    setSelectedPhotoUri(null);
    setReportLocation(
      type.geometry === 'polygon'
        ? null
        : {
            latitude: region.latitude,
            longitude: region.longitude,
          }
    );
    setReportAreaPoints([]);
    setIsTypePickerOpen(false);
  }

  function cancelReport() {
    setReportLocation(null);
    setReportAreaPoints([]);
    setSelectedReportType(null);
    setReportTitle('');
    setReportDescription('');
    setReportPhotoUrl('');
    setSelectedPhotoUri(null);
    setIsReportOpen(false);
    setIsTypePickerOpen(false);
    setErrorMessage('');
  }

  function addAreaPoint(coordinate) {
    setReportAreaPoints((currentPoints) => [...currentPoints, coordinate]);
  }

  function removeLastAreaPoint() {
    setReportAreaPoints((currentPoints) => currentPoints.slice(0, -1));
  }

  async function askMediaPermission() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissao necessaria',
        'Permita o acesso as fotos para escolher uma imagem.'
      );
      return false;
    }

    return true;
  }

  async function askCameraPermission() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissao necessaria',
        'Permita o acesso a camera para tirar uma foto.'
      );
      return false;
    }

    return true;
  }

  async function pickReportImage() {
    const hasPermission = await askMediaPermission();

    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedPhotoUri(uri);
      setReportPhotoUrl(uri);
    }
  }

  async function takeReportPhoto() {
    const hasPermission = await askCameraPermission();

    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedPhotoUri(uri);
      setReportPhotoUrl(uri);
    }
  }
  async function uploadReportPhoto(uri) {
  const formData = new FormData();

  formData.append('photo', {
    uri,
    name: 'report-photo.jpg',
    type: 'image/jpeg',
  });

  const response = await fetch(`${API_URL}/reports/photo`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao enviar foto');
  }

  return data.photoUrl;
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

  function renderStoredReports() {
    return reports.map((report) => {
      if (report.geometry?.type === 'Point') {
        return (
          <Marker
            key={report._id}
            coordinate={geoJsonPointToCoordinate(report.geometry.coordinates)}
            onPress={() => {
              setSelectedBackendReport(report);
            }}
          >
            <View style={styles.storedMarker}>
              <Text style={styles.customMarkerText}>!</Text>
            </View>
          </Marker>
        );
      }

      if (report.geometry?.type === 'Polygon') {
        return (
          <Polygon
            key={report._id}
            coordinates={geoJsonPolygonToCoordinates(report.geometry.coordinates)}
            strokeColor="#f9c74f"
            fillColor="rgba(249, 199, 79, 0.28)"
            strokeWidth={3}
            tappable
            onPress={() => {
              setSelectedBackendReport(report);
            }}
          />
        );
      }

      return null;
    });
  }

  async function submitReport() {
    setErrorMessage('');
    setIsSubmitting(true);
    let photoUrl = reportPhotoUrl.trim()
    if (selectedPhotoUri?.startsWith('file://')) {
  photoUrl = await uploadReportPhoto(selectedPhotoUri);
}

  await createReport({
  title: reportTitle.trim(),
  description: reportDescription.trim(),
  photoUrl,
  geometryType: isPolygonReport ? 'polygon' : 'point',
  geometry,
});
    try {
      if (!reportTitle.trim()) {
        throw new Error('Titulo e obrigatorio');
      }

      const geometry = isPolygonReport
        ? {
            type: 'Polygon',
            coordinates: areaPointsToGeoJsonPolygon(reportAreaPoints),
          }
        : {
            type: 'Point',
            coordinates: coordinateToGeoJsonPoint(reportLocation),
          };

      await createReport({
        title: reportTitle.trim(),
        description: reportDescription.trim(),
        photoUrl: reportPhotoUrl.trim(),
        geometryType: isPolygonReport ? 'polygon' : 'point',
        geometry,
      });

      await loadReports();
      cancelReport();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVote(voteType) {
    if (!selectedBackendReport) {
      return;
    }

    setErrorMessage('');

    try {
      const updatedReport =
        voteType === 'up'
          ? await upvoteReport(selectedBackendReport._id)
          : await downvoteReport(selectedBackendReport._id);

      setReports((currentReports) =>
        currentReports.map((report) =>
          report._id === updatedReport._id ? updatedReport : report
        )
      );
      setSelectedBackendReport(updatedReport);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={defaultRegion}
        region={region}
        showsUserLocation
        onRegionChangeComplete={setRegion}
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
        {renderStoredReports()}
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

      {selectedBackendReport && !selectedReportType && (
        <View style={styles.reportDetailsPanel}>
          <Text style={styles.reportDetailsTitle}>
            {selectedBackendReport.title ||
              (selectedBackendReport.geometryType === 'polygon'
                ? 'Local sem luz'
                : 'Ocorrencia')}
          </Text>

          {selectedBackendReport.description ? (
            <Text style={styles.reportDetailsText}>
              {selectedBackendReport.description}
            </Text>
          ) : null}

          {selectedBackendReport.photoUrl ? (
            <Image
              source={{ uri: selectedBackendReport.photoUrl }}
              style={styles.reportPhoto}
            />
          ) : null}

          <Text style={styles.reportDetailsText}>
            Upvotes: {selectedBackendReport.upVotes || 0}
          </Text>
          <Text style={styles.reportDetailsText}>
            Downvotes: {selectedBackendReport.downVotes || 0}
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.voteActions}>
            <Pressable style={styles.voteButton} onPress={() => handleVote('up')}>
              <Text style={styles.voteButtonText}>Upvote</Text>
            </Pressable>
            <Pressable style={styles.voteButton} onPress={() => handleVote('down')}>
              <Text style={styles.voteButtonText}>Downvote</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.closeDetailsButton}
            onPress={() => {
              setSelectedBackendReport(null);
              setErrorMessage('');
            }}
          >
            <Text style={styles.closeDetailsText}>Fechar</Text>
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

            <TextInput
              style={styles.input}
              placeholder="Titulo"
              value={reportTitle}
              onChangeText={setReportTitle}
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              multiline
              placeholder="Descricao"
              textAlignVertical="top"
              value={reportDescription}
              onChangeText={setReportDescription}
            />

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="URL da foto"
              value={reportPhotoUrl}
              onChangeText={(value) => {
                setReportPhotoUrl(value);
                setSelectedPhotoUri(value);
              }}
            />

            <View style={styles.photoActions}>
              <Pressable style={styles.photoButton} onPress={pickReportImage}>
                <Text style={styles.photoButtonText}>Galeria</Text>
              </Pressable>

              <Pressable style={styles.photoButton} onPress={takeReportPhoto}>
                <Text style={styles.photoButtonText}>Camera</Text>
              </Pressable>
            </View>

            {selectedPhotoUri ? (
              <>
                <Image
                  source={{ uri: selectedPhotoUri }}
                  style={styles.selectedPhoto}
                />

                <Pressable
                  style={styles.secondaryPanelButton}
                  onPress={() => {
                    setSelectedPhotoUri(null);
                    setReportPhotoUrl('');
                  }}
                >
                  <Text style={styles.secondaryPanelButtonText}>Remover foto</Text>
                </Pressable>
              </>
            ) : null}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Pressable
              style={[styles.closeButton, isSubmitting && styles.disabledButton]}
              disabled={isSubmitting}
              onPress={submitReport}
            >
              <Text style={styles.closeButtonText}>
                {isSubmitting ? 'Enviando...' : 'Enviar report'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryPanelButton}
              onPress={() => {
                cancelReport();
              }}
            >
              <Text style={styles.secondaryPanelButtonText}>Cancelar</Text>
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

  storedMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d90429',
    alignItems: 'center',
    justifyContent: 'center',
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

  input: {
    width: '100%',
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#000',
  },

  descriptionInput: {
    minHeight: 96,
  },

  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  photoButton: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },

  photoButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  selectedPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e7e7e7',
    marginBottom: 8,
  },

  errorText: {
    color: '#d90429',
    marginBottom: 12,
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

  secondaryPanelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },

  secondaryPanelButtonText: {
    color: '#000',
    fontWeight: '700',
  },

  reportDetailsPanel: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },

  reportDetailsTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  reportDetailsText: {
    color: '#333',
    marginBottom: 4,
  },

  reportPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e7e7e7',
    marginBottom: 12,
  },

  voteActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  voteButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  voteButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  closeDetailsButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },

  closeDetailsText: {
    color: '#000',
    fontWeight: '700',
  },
});
