import { Fragment, useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  API_URL,
  createReport,
  downvoteReport,
  getReports,
  upvoteReport,
} from '../../services/api';
import { getToken } from '../../services/authStorage';

const defaultRegion = {
  latitude: -27.6017,
  longitude: -48.5192,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};
const screenDimensions = Dimensions.get('window');
const screenWidth = screenDimensions.width;
const screenHeight = screenDimensions.height;
const typePickerHorizontalPadding = 18;
const typePickerInnerPadding = 14;
const typeGridGap = 8;
const typePickerWidth = Math.min(screenWidth - typePickerHorizontalPadding * 2, 380);
const typeButtonWidth = Math.floor(
  (typePickerWidth - typePickerInnerPadding * 2 - typeGridGap * 2) / 3
);
const REPORT_TITLE_MAX_LENGTH = 20;
const REPORT_DESCRIPTION_MAX_LENGTH = 800;
const reportDetailsBottomOffset = 86;
const reportDetailsTopOffset = 24;
const reportDetailsMaxHeight =
  screenHeight - reportDetailsBottomOffset - reportDetailsTopOffset;

const reportTypes = [
  {
    id: 'atividadesuspeita',
    title: 'Atividade suspeita',
    geometry: 'marker',
    color: '#f59e0b',
    icon: require('../../assets/icons/atividadesuspeita.png'),
  },
  {
    id: 'furto',
    title: 'Furto',
    geometry: 'marker',
    color: '#e11d48',
    icon: require('../../assets/icons/furto.png'),
  },
  {
    id: 'assalto',
    title: 'Assalto',
    geometry: 'marker',
    color: '#b91c1c',
    icon: require('../../assets/icons/assalto.png'),
  },
  {
    id: 'rouboveiculo',
    title: 'Roubo de veículos',
    geometry: 'marker',
    color: '#f97316',
    icon: require('../../assets/icons/roubocarro.png'),
  },
  {
    id: 'sequestro',
    title: 'Sequestro',
    geometry: 'marker',
    color: '#6d28d9',
    icon: require('../../assets/icons/sequestro.png'),
  },
  {
    id: 'violenciacontraamulher',
    title: 'Violência contra a mulher',
    geometry: 'marker',
    color: '#c026d3',
    icon: require('../../assets/icons/violenciamulher.png'),
  },
  {
    id: 'pichacao',
    title: 'Pichação',
    geometry: 'marker',
    color: '#8b5cf6',
    icon: require('../../assets/icons/pichacao.png'),
  },
  {
    id: 'buraco',
    title: 'Buraco',
    geometry: 'marker',
    color: '#92400e',
    icon: require('../../assets/icons/buraco.png'),
  },
  {
    id: 'problemasnacerca',
    title: 'Problemas na cerca',
    geometry: 'marker',
    color: '#475569',
    icon: require('../../assets/icons/buraconacerca.png'),
  },
  {
    id: 'vazamento',
    title: 'Vazamento',
    geometry: 'marker',
    color: '#06b6d4',
    icon: require('../../assets/icons/vazamento.png'),
  },
  {
    id: 'alagamento',
    title: 'Alagamento',
    geometry: 'marker',
    color: '#2563eb',
    icon: require('../../assets/icons/alagamento.png'),
  },
  {
    id: 'problemaestrutural',
    title: 'Problema estrutural',
    geometry: 'marker',
    color: '#78716c',
    icon: require('../../assets/icons/infraestrutura.png'),
  },
  {
    id: 'dark-area',
    title: 'Local sem luz',
    geometry: 'polygon',
    color: '#111827',
    icon: require('../../assets/icons/ruasemluz.png'),
  },
  {
    id: 'gramaalta',
    title: 'Grama alta',
    geometry: 'marker',
    color: '#16a34a',
    icon: require('../../assets/icons/gramaalta.png'),
  },
  {
    id: 'outro',
    title: 'Outro',
    geometry: 'marker',
    color: '#14b8a6',
    icon: require('../../assets/icons/outro.png'),
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

function getPolygonCenter(coordinates) {
  const polygonCoordinates = geoJsonPolygonToCoordinates(coordinates);
  const uniqueCoordinates = polygonCoordinates.slice(0, -1);
  const coordinateCount = uniqueCoordinates.length || polygonCoordinates.length;
  const coordinatesToAverage = uniqueCoordinates.length ? uniqueCoordinates : polygonCoordinates;
  const totals = coordinatesToAverage.reduce(
    (accumulator, coordinate) => ({
      latitude: accumulator.latitude + coordinate.latitude,
      longitude: accumulator.longitude + coordinate.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: totals.latitude / coordinateCount,
    longitude: totals.longitude / coordinateCount,
  };
}

function getReportTypeById(typeId) {
  return reportTypes.find((type) => type.id === typeId);
}

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace('#', '');
  const red = parseInt(cleanHex.slice(0, 2), 16);
  const green = parseInt(cleanHex.slice(2, 4), 16);
  const blue = parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getReportRemainingMilliseconds(report, currentTime) {
  if (!report?.expiresAt) {
    return null;
  }

  return new Date(report.expiresAt).getTime() - currentTime.getTime();
}

function formatReportRemainingTime(report, currentTime) {
  if (report?.status === 'inativo') {
    return 'inativo';
  }

  const remainingMilliseconds = getReportRemainingMilliseconds(report, currentTime);

  if (remainingMilliseconds === null || remainingMilliseconds <= 0) {
    return 'inativo';
  }

  const totalHours = Math.ceil(remainingMilliseconds / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return `${days}d ${hours}h`;
}

function getReportDeadlineDescription(report, currentTime) {
  const remainingTime = formatReportRemainingTime(report, currentTime);

  if (remainingTime === 'inativo') {
    return 'Essa ocorrência já está inativa.';
  }

  return `Essa ocorrência ficará inativa daqui ${remainingTime} caso não receba nenhum upvote.`;
}

export default function MainMap() {
  const [region, setRegion] = useState(defaultRegion);
  const [reports, setReports] = useState([]);
  const [selectedBackendReport, setSelectedBackendReport] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDeadlineInfoOpen, setIsDeadlineInfoOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
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
    setReportTitle('');
    setReportDescription('');
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

  function openImageAttachmentOptions() {
    Alert.alert(
      'Anexar imagem',
      'Escolha de onde vem a imagem do report.',
      [
        {
          text: 'Camera',
          onPress: takeReportPhoto,
        },
        {
          text: 'Galeria',
          onPress: pickReportImage,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
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
    }
  }

  async function uploadReportPhoto(uri) {
    const formData = new FormData();

    formData.append('photo', {
      uri,
      name: 'report-photo.jpg',
      type: 'image/jpeg',
    });

    const token = await getToken();

    if (!token) {
      throw new Error('Login necessario para enviar foto');
    }

    const response = await fetch(`${API_URL}/reports/photo`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao enviar foto');
    }

    return data.photoUrl;
  }

  function renderReportIcon(type, iconStyle = styles.markerIcon) {
    if (type?.icon) {
      return <Image source={type.icon} style={iconStyle} />;
    }

    return (
      <Text style={styles.customMarkerText}>
        {type?.symbol || '!'}
      </Text>
    );
  }

  function getMarkerMetrics() {
    const latitudeDelta = region.latitudeDelta || defaultRegion.latitudeDelta;
    const zoomProgress = clamp((0.018 - latitudeDelta) / 0.016, 0, 1);
    const size = Math.round(34 + zoomProgress * 12);

    return {
      size,
      borderRadius: size / 2,
      iconSize: Math.round(size * 0.58),
    };
  }

  function getMapMarkerStyle(type) {
    const marker = getMarkerMetrics();

    return {
      width: marker.size,
      height: marker.size,
      borderRadius: marker.borderRadius,
      borderColor: type?.color || '#d90429',
    };
  }

  function getMapMarkerIconStyle() {
    const marker = getMarkerMetrics();

    return {
      width: marker.iconSize,
      height: marker.iconSize,
      resizeMode: 'contain',
    };
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
              fillColor={hexToRgba(selectedReportType.color, 0.28)}
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
            styles.mapMarker,
            getMapMarkerStyle(selectedReportType),
          ]}
        >
          {renderReportIcon(selectedReportType, getMapMarkerIconStyle())}
        </View>
      </Marker>
    );
  }

  function renderStoredReports() {
    return reports.map((report) => {
      const reportType = getReportTypeById(report.typeId);

      if (report.geometry?.type === 'Point') {
        return (
          <Marker
            key={report._id}
            coordinate={geoJsonPointToCoordinate(report.geometry.coordinates)}
            onPress={() => {
              setIsDeadlineInfoOpen(false);
              setSelectedBackendReport(report);
            }}
          >
            <View
              style={[
                styles.mapMarker,
                getMapMarkerStyle(reportType),
              ]}
            >
              {renderReportIcon(reportType, getMapMarkerIconStyle())}
            </View>
          </Marker>
        );
      }

      if (report.geometry?.type === 'Polygon') {
        return (
          <Fragment key={report._id}>
            <Polygon
              coordinates={geoJsonPolygonToCoordinates(report.geometry.coordinates)}
              strokeColor={reportType?.color || '#111827'}
              fillColor={hexToRgba(reportType?.color || '#111827', 0.28)}
              strokeWidth={3}
              tappable
              onPress={() => {
                setIsDeadlineInfoOpen(false);
                setSelectedBackendReport(report);
              }}
            />

            <Marker
              coordinate={getPolygonCenter(report.geometry.coordinates)}
              onPress={() => {
                setIsDeadlineInfoOpen(false);
                setSelectedBackendReport(report);
              }}
            >
              <View
                style={[
                  styles.mapMarker,
                  getMapMarkerStyle(reportType),
                ]}
              >
                {renderReportIcon(reportType, getMapMarkerIconStyle())}
              </View>
            </Marker>
          </Fragment>
        );
      }

      return null;
    });
  }

  async function submitReport() {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!reportTitle.trim()) {
        throw new Error('Titulo e obrigatorio');
      }

      let photoUrl = '';

      if (selectedPhotoUri) {
        photoUrl = await uploadReportPhoto(selectedPhotoUri);
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
        typeId: selectedReportType.id,
        title: reportTitle.trim(),
        description: reportDescription.trim(),
        photoUrl,
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
            <Text style={styles.reportButtonText}>ADICIONAR OCORRÊNCIA</Text>
          </Pressable>
        )}

      {isTypePickerOpen && (
        <View style={styles.centerActions}>
          <View style={styles.typePicker}>
            <View style={styles.typePickerHeader}>
              <Text style={styles.typePickerTitle}>Tipo de ocorrência</Text>

              <Pressable
                style={styles.typePickerClose}
                onPress={() => {
                  setIsTypePickerOpen(false);
                }}
              >
                <Text style={styles.typePickerCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.typeGrid}
              showsVerticalScrollIndicator={false}
            >
              {reportTypes.map((type) => (
                <Pressable
                  key={type.id}
                  style={({ pressed }) => [
                    styles.typeButton,
                    { borderColor: type.color },
                    pressed && styles.typeButtonPressed,
                  ]}
                  onPress={() => {
                    startReport(type);
                  }}
                >
                  <View style={styles.typeIconWrap}>
                    {renderReportIcon(type, styles.typeIcon)}
                  </View>
                  <Text style={styles.typeButtonText}>{type.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
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
          <View style={styles.reportDetailsHeader}>
            <View style={styles.reportDetailsHeading}>
              <View style={styles.reportDetailsTitleRow}>
                <Text style={styles.reportDetailsTitle} numberOfLines={2}>
                  {selectedBackendReport.title ||
                    (selectedBackendReport.geometryType === 'polygon'
                      ? 'Local sem luz'
                      : 'Ocorrencia')}
                </Text>

                <Pressable
                  style={styles.deadlinePill}
                  onPress={() => {
                    setIsDeadlineInfoOpen((currentValue) => !currentValue);
                  }}
                >
                  <Text style={styles.deadlinePillText}>
                    {formatReportRemainingTime(selectedBackendReport, currentTime)}
                  </Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.reportTypeChip,
                  {
                    borderColor:
                      getReportTypeById(selectedBackendReport.typeId)?.color ||
                      '#111827',
                  },
                ]}
              >
                <Text style={styles.reportTypeChipText}>
                  {getReportTypeById(selectedBackendReport.typeId)?.title ||
                    (selectedBackendReport.geometryType === 'polygon'
                      ? 'Área'
                      : 'Ponto')}
                </Text>
              </View>

              {isDeadlineInfoOpen ? (
                <View style={styles.deadlineInfoBox}>
                  <Text style={styles.deadlineInfoText}>
                    {getReportDeadlineDescription(selectedBackendReport, currentTime)}
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              style={styles.closeDetailsIconButton}
              onPress={() => {
                setSelectedBackendReport(null);
                setIsDeadlineInfoOpen(false);
                setErrorMessage('');
              }}
            >
              <Text style={styles.closeDetailsIconText}>×</Text>
            </Pressable>
          </View>

          {selectedBackendReport.photoUrl ? (
            <View style={styles.reportPhotoFrame}>
              <Image
                source={{ uri: selectedBackendReport.photoUrl }}
                style={styles.reportPhoto}
              />
            </View>
          ) : null}

          <Text style={styles.descriptionLabel}>Descrição</Text>

          <View style={styles.reportDescriptionBox}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={styles.reportDescriptionContent}
            >
              <Text style={styles.reportDetailsText}>
                {selectedBackendReport.description || 'Sem descrição.'}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.reportDetailsErrorSlot}>
            {errorMessage ? (
              <Text style={styles.reportDetailsError} numberOfLines={1}>
                {errorMessage}
              </Text>
            ) : null}
          </View>

          <View style={styles.reportDetailsFooter}>
            <View style={styles.voteActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.voteIconButton,
                  styles.upvoteButton,
                  pressed && styles.voteButtonPressed,
                ]}
                onPress={() => handleVote('up')}
              >
                <Image
                  source={require('../../assets/icons/upvote.png')}
                  style={styles.voteIcon}
                />
              </Pressable>

              <Text style={styles.voteScore}>
                {(selectedBackendReport.upVotes || 0) -
                  (selectedBackendReport.downVotes || 0)}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.voteIconButton,
                  styles.downvoteButton,
                  pressed && styles.voteButtonPressed,
                ]}
                onPress={() => handleVote('down')}
              >
                <Image
                  source={require('../../assets/icons/downvote.png')}
                  style={styles.voteIcon}
                />
              </Pressable>
            </View>
          </View>
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
              placeholder="Titulo obrigatorio"
              maxLength={REPORT_TITLE_MAX_LENGTH}
              value={reportTitle}
              onChangeText={setReportTitle}
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              multiline
              placeholder="Descricao"
              textAlignVertical="top"
              maxLength={REPORT_DESCRIPTION_MAX_LENGTH}
              value={reportDescription}
              onChangeText={setReportDescription}
            />
            <Text style={styles.characterCounter}>
              {reportDescription.length}/{REPORT_DESCRIPTION_MAX_LENGTH}
            </Text>

            <Pressable style={styles.photoDropzone} onPress={openImageAttachmentOptions}>
              {selectedPhotoUri ? (
                <Image
                  source={{ uri: selectedPhotoUri }}
                  style={styles.selectedPhoto}
                />
              ) : (
                <>
                  <Text style={styles.photoDropzoneText}>anexe uma imagem</Text>
                  <Text style={styles.photoDropzoneAscii}>^</Text>
                </>
              )}
            </Pressable>

            {selectedPhotoUri ? (
              <Pressable
                style={styles.secondaryPanelButton}
                onPress={() => {
                  setSelectedPhotoUri(null);
                }}
              >
                <Text style={styles.secondaryPanelButtonText}>Remover imagem</Text>
              </Pressable>
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
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 96,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  typePicker: {
    width: typePickerWidth,
    maxWidth: 380,
    maxHeight: '82%',
    backgroundColor: 'rgba(246, 246, 246, 0.96)',
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 10,
  },

  typePickerHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  typePickerTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '800',
  },

  typePickerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  typePickerCloseText: {
    color: '#111',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '500',
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },

  typeButton: {
    width: typeButtonWidth,
    minHeight: 104,
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    borderWidth: 1.4,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeButtonPressed: {
    opacity: 0.68,
    transform: [{ scale: 0.98 }],
  },

  typeIconWrap: {
    width: 56,
    height: 56,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },

  typeButtonText: {
    color: '#111',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
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
    right: 36,
    bottom: 28,
    left: 36,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(246, 246, 246, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(246, 246, 246, 0.75)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },

  reportButtonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },

  mapMarker: {
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 5,
  },

  markerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  customMarkerText: {
    color: '#111',
    fontWeight: '700',
  },

  areaPointMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  areaPointText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
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
    backgroundColor: '#f6f6f6',
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

  characterCounter: {
    alignSelf: 'flex-end',
    color: '#64748b',
    fontSize: 12,
    marginTop: -6,
    marginBottom: 10,
  },

  photoDropzone: {
    width: '100%',
    minHeight: 132,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },

  photoDropzoneText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  photoDropzoneAscii: {
    color: '#64748b',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 4,
  },

  selectedPhoto: {
    width: '100%',
    height: 132,
    backgroundColor: '#e7e7e7',
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
    bottom: reportDetailsBottomOffset,
    left: 20,
    maxHeight: reportDetailsMaxHeight,
    backgroundColor: '#f6f6f6',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  reportDetailsHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  reportDetailsHeading: {
    flex: 1,
    paddingRight: 12,
  },

  reportDetailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },

  reportDetailsTitle: {
    flex: 1,
    color: '#000',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },

  deadlinePill: {
    minWidth: 64,
    borderWidth: 1.5,
    borderColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(246, 246, 246, 0.94)',
    alignItems: 'center',
  },

  deadlinePillText: {
    color: '#111827',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
  },

  deadlineInfoBox: {
    alignSelf: 'flex-start',
    maxWidth: '96%',
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
  },

  deadlineInfoText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  reportTypeChip: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
  },

  reportTypeChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },

  closeDetailsIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeDetailsIconText: {
    color: '#111',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },

  descriptionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  reportDescriptionBox: {
    height: 132,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    marginBottom: 0,
    overflow: 'hidden',
  },

  reportDescriptionContent: {
    padding: 12,
  },

  reportDetailsText: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 20,
  },

  reportPhotoFrame: {
    width: '100%',
    height: 92,
    borderRadius: 10,
    backgroundColor: '#e7e7e7',
    marginBottom: 8,
    overflow: 'hidden',
  },

  reportPhoto: {
    width: '100%',
    height: '100%',
  },

  reportDetailsErrorSlot: {
    minHeight: 20,
    justifyContent: 'center',
    marginTop: 6,
  },

  reportDetailsError: {
    color: '#d90429',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },

  reportDetailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  voteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(246, 246, 246, 0.94)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246, 246, 246, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },

  voteIconButton: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  upvoteButton: {
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.5)',
  },

  downvoteButton: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
  },

  voteButtonPressed: {
    opacity: 0.72,
  },

  voteIcon: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
  },

  voteScore: {
    minWidth: 18,
    color: '#111827',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    textAlign: 'center',
  },

});
