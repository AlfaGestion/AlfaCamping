import { useState, useEffect, useContext } from "react";
import { Alert, Text, TouchableOpacity, View, TextInput, ScrollView, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { newOrderStyles } from "@/styles/OrderStyle";
import { newTaskStyles } from "@/styles/TaskStyle";

// import CDateTimePicker from "@/components/DateTimePicker";
import InputDate from "@/components/InputDate";
import SelectItem from "@/components/SelectItem";

import { formatDate } from "@/utils/Utils";
import { IngresoContext } from "@/context/IngresoContext";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useLocalSearchParams } from 'expo-router';

export default function New() {
  const { id } = useLocalSearchParams();
  
  const {
    ingreso, setIngreso,
    ingresoDate, setIngresoDate,
    ingresoString, setIngresoString,
    showIngreso, setShowIngreso,

    egresoDate, setEgresoDate,
    egresoString, setEgresoString,
    showEgreso, setShowEgreso,
    
    dniRef, nombreRef, parcelaRef, nacionalidadRef, direccionRef, ciudadRef, telefonoRef, patenteRef, modeloRef,
    dniRefresh, nombreRefresh, parcelaRefresh, nacionalidadRefresh, direccionRefresh, ciudadRefresh, telefonoRefresh, patenteRefresh, modeloRefresh,
    handleDniSubmit, handleNombreSubmit, handleParcelaSubmit, handleNacionalidadSubmit, handleDireccionSubmit, handleCiudadSubmit, handleTelefonoSubmit, handlePatenteSubmit, handleModeloSubmit,

    isEditIngreso, setIsEditIngreso,

    handleSaveIngreso, handleDeleteIngreso,
   } = useContext(IngresoContext);

  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  
  // const searchCliente = async (dni) => {
  //   setIngreso({ ...ingreso, dni });

  //   try {
  //     const data = await ClienteIngreso.findLikeDni(dni);
  //     setClientes(data);
  //   } catch (error) {
  //     console.error(error);
  //     Alert.alert("Error", error.message);
  //   }
  // };

  // const fetchClienteData = async () => {
  //   try {
  //     const [data] = await ClienteIngreso.findByDni(selectedCliente);

  //     // console.log('fetchClienteData', data)
      
  //     setIngreso({
  //       apellido_nombre: data?.apellido_nombre,
  //       dni: data?.dni,
  //       nacionalidad: data?.nacionalidad,
  //       direccion: data?.direccion,
  //       ciudad: data?.ciudad,
  //       patente: data?.patente,
  //       modelo_vehiculo: data?.modelo_vehiculo,

  //       trekking: data?.trekking,
  //       kayak: data?.kayak,
  //       embarcado: data?.embarcado,
  //       amarre: data?.amarre,

  //       bajada_lancha: data?.bajada_lancha,
  //       adultos: data?.adultos,
  //       menores: data?.menores,
  //       jubilados: data?.jubilados,
  //     });

  //   } catch (error) {
  //     console.error(error);
  //     Alert.alert("Error", error.message);
  //   }
  // }

  // useEffect(() => {
  //   if(selectedCliente) {
  //     fetchClienteData();
  //   }
  // }, [selectedCliente]);

  // useEffect(() => {
  //   const id = navigation.getParam("id", null);
  //   if (id) {
  //     loadIngresoFromDb(id);
  //   } else {
  //     setIngreso({});
  //     setIsEditIngreso(false);

  //     const completeDate = formatDate(new Date());
  //     const simplifiedDate = formatDate(new Date(), true);

  //     setIngresoDate(completeDate);
  //     setIngresoString(simplifiedDate);

  //     setEgresoDate(new Date());
  //     setEgresoString('');
  //   }
  // }, []);

  // const loadIngresoFromDb = async (id) => {
  //   const [dataIngreso] = await Ingreso.findById(id);

  //   setIsEditIngreso(true);
  //   handleSelIngreso(dataIngreso);
  // };
  
  // const deleteIngreso = async () => {
  //   const id = navigation.getParam("id", null);
  //   await Ingreso.destroy(id);
    
  //   setDeleteFlag('');
  //   navigation.navigate("HomeScreen", { reload: true });

  //   // navigation.setParams("reload", true);
  //   // navigation.goBack();
  // };

  // const handleSelIngreso = (dataIngreso) => {
  //   setIngreso({
  //     ingreso: dataIngreso?.ingreso,
  //     egreso: dataIngreso?.egreso,
  //     parcela: dataIngreso?.parcela?.toString(),
  //     apellido_nombre: dataIngreso?.apellido_nombre,
  //     dni: dataIngreso?.dni,
  //     nacionalidad: dataIngreso?.nacionalidad,
  //     direccion: dataIngreso?.direccion,
  //     modelo_vehiculo: dataIngreso?.modelo_vehiculo,
  //     ciudad: dataIngreso?.ciudad,
  //     patente: dataIngreso?.patente,

  //     trekking: !!dataIngreso?.trekking,
  //     kayak: !!dataIngreso?.kayak,
  //     embarcado: !!dataIngreso?.embarcado,
  //     amarre: !!dataIngreso?.amarre,

  //     bajada_lancha: dataIngreso?.bajada_lancha?.toString(),
  //     adultos: dataIngreso?.adultos?.toString(),
  //     menores: dataIngreso?.menores?.toString(),
  //     jubilados: dataIngreso?.jubilados?.toString(),
  //     observaciones: dataIngreso?.observaciones,
  //   });

  //   setIngresoString(dataIngreso?.ingreso);
  //   setEgresoString(dataIngreso?.egreso);
  // };
  
  const showIngresoPicker = () => {
    setShowIngreso(true);
    Keyboard.dismiss();
  };
  
  const handleChangeIngreso = (event, selectedDate) => {
    let currentDate = selectedDate || ingresoDate;
    setShowIngreso(false);
    setIngresoDate(formatDate(currentDate));
    setIngresoString(formatDate(currentDate, true));
  };
  
  const showEgresoPicker = () => {
    setShowEgreso(true);
    Keyboard.dismiss();
  };
  
  const handleChangeEgreso = (event, selectedDate) => {
    let currentDate = selectedDate || egresoDate;
    setShowEgreso(false);
    setEgresoDate(formatDate(currentDate));
    setEgresoString(formatDate(currentDate, true));
  };
  
  useEffect(() => {
    if (id) {
      loadIngresoFromDb(id);
      console.log('if', id);
    } else {
      console.log('else', id);
      setIngreso({});
      setIsEditIngreso(false);
      
      const completeDate = formatDate(new Date());
      const simplifiedDate = formatDate(new Date(), true);

      setIngresoDate(completeDate);
      setIngresoString(simplifiedDate);

      setEgresoDate(new Date());
      setEgresoString('');
    }
  }, [id])
  
  const loadIngresoFromDb = async (id) => {
    const [response] = await ingresoDb.findById(id);

    console.log('AAAAA', response);
    
    if (response) {
      setIngreso(response);
      setIsEditIngreso(true);
    } else {
      return Alert.alert("Ingreso inexistente", "Su ingreso fue eliminado pero no se recargó la pantalla. ¿Desea recargar o ver los datos del ingreso eliminado antes?", [
        {
          text: "Recargar",
          onPress: () => {
            router.reload();
          },
        },
        {
          text: "Volver",
        },
      ]);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView style={[newTaskStyles.containerScroll]}>

        <View style={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
          <View style={{ width: '49%' }}>
            <InputDate
              fullWidth={true}
              title="Ingreso"
              value={ingresoString}
              callback={showIngresoPicker}
            ></InputDate>
          </View>
          
          {showIngreso &&
            <DateTimePicker
              testID="dateTimePicker"
              value={ingresoDate}
              mode="date"
              display="default"
              is24Hour={true}
              onChange={handleChangeIngreso}
            />
          }
          
          <View style={{ width: '49%' }}>
            <InputDate
              fullWidth={true}
              title="Egreso"
              value={egresoString}
              callback={showEgresoPicker}
            ></InputDate>
          </View>
          
          {showEgreso &&
            <DateTimePicker
              testID="dateTimePicker2"
              value={egresoDate}
              mode="date"
              display="default"
              is24Hour={true}
              onChange={handleChangeEgreso}
            />
          }
        </View>
        
        <SelectItem
          style={[newTaskStyles.element]}
          title="DNI"
          placeholder="DNI"
          data={clientes}
          // defaultValue={ingreso?.dni}
          saveState={setSelectedCliente}
          valueState={selectedCliente}
          resetDataFn={setClientes}
          fieldCode="dni"
          fieldName="dni"
          key={1}
          // changeTextFn={searchCliente}
          keyboardType="numeric"
          inputKey={dniRefresh}
          inputRef={dniRef}
          onSubmitEditingFn={handleDniSubmit}
          returnKeyType='next'
        />
        
        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Nombre y Apellido</Text>
          <TextInput
            value={ingreso?.apellido_nombre}
            onChangeText={(text) => setIngreso({ ...ingreso, apellido_nombre: text })}
            style={[newTaskStyles.textInput]}
            placeholder="Nombre y Apellido"
            key={nombreRefresh}
            ref={nombreRef}
            onSubmitEditing={handleNombreSubmit}
            returnKeyType='next'
            cursorColor="#C0C0C0"
          />
        </View>
        
        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Parcela N°</Text>
          <TextInput
            value={ingreso?.parcela}
            onChangeText={(text) => setIngreso({ ...ingreso, parcela: text })}
            style={[newTaskStyles.textInput]}
            placeholder="Parcela N°"
            key={parcelaRefresh}
            ref={parcelaRef}
            onSubmitEditing={handleParcelaSubmit}
            returnKeyType='next'
            keyboardType='numeric'
            cursorColor="#C0C0C0"
          />
        </View>
        
        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Nacionalidad</Text>
          <TextInput
            value={ingreso?.nacionalidad}
            onChangeText={(text) => setIngreso({ ...ingreso, nacionalidad: text })}
            style={[newTaskStyles.textInput]}
            placeholder="Nacionalidad"
            key={nacionalidadRefresh}
            ref={nacionalidadRef}
            onSubmitEditing={handleNacionalidadSubmit}
            returnKeyType='next'
            cursorColor="#C0C0C0"
          />
        </View>
        
        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Dirección</Text>
          <TextInput
            value={ingreso?.direccion}
            onChangeText={(text) => setIngreso({ ...ingreso, direccion: text })}
            style={[newTaskStyles.textInput]}
            placeholder="Dirección"
            key={direccionRefresh}
            ref={direccionRef}
            onSubmitEditing={handleDireccionSubmit}
            returnKeyType='next'
            cursorColor="#C0C0C0"
          />
        </View>
        
        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Ciudad</Text>
          <TextInput
            value={ingreso?.ciudad}
            onChangeText={(text) => setIngreso({ ...ingreso, ciudad: text })}
            style={[newTaskStyles.textInput]}
            placeholder="Ciudad"
            key={ciudadRefresh}
            ref={ciudadRef}
            onSubmitEditing={handleCiudadSubmit}
            returnKeyType='next'
            cursorColor="#C0C0C0"
          />
        </View>

        <View style={[newTaskStyles.element]}>
          <Text style={[newTaskStyles.label]}>Telefono</Text>
          <TextInput
            value={ingreso?.telefono}
            onChangeText={(text) => setIngreso({ ...ingreso, telefono: text })}
            style={[newTaskStyles.textInput]}
            placeholder="Telefono"
            key={telefonoRefresh}
            ref={telefonoRef}
            onSubmitEditing={handleTelefonoSubmit}
            returnKeyType='next'
            cursorColor="#C0C0C0"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
          <View style={[newTaskStyles.containerDates, { width: '50%' }]}>
            <Text style={[newTaskStyles.label]}>Patente</Text>
            <TextInput
              value={ingreso?.patente}
              onChangeText={(text) => setIngreso({ ...ingreso, patente: text })}
              style={[newTaskStyles.textInput]}
              placeholder="Patente"
              key={patenteRefresh}
              ref={patenteRef}
              onSubmitEditing={handlePatenteSubmit}
              returnKeyType='next'
              cursorColor="#C0C0C0"
            />
          </View>
          
          <View style={[newTaskStyles.containerDates, { width: '50%' }]}>
            <Text style={[newTaskStyles.label]}>Modelo vehículo</Text>
            <TextInput
              value={ingreso?.modelo_vehiculo}
              onChangeText={(text) => setIngreso({ ...ingreso, modelo_vehiculo: text })}
              style={[newTaskStyles.textInput]}
              placeholder="Modelo vehículo"
              key={modeloRefresh}
              ref={modeloRef}
              onSubmitEditing={handleModeloSubmit}
              returnKeyType='next'
              cursorColor="#C0C0C0"
            />
          </View>
        </View>
        {/* cierre FORM */}
        
        <TouchableOpacity
          onPress={() => { router.push("/ingresos/next"); }}
          style={[
            { ...newOrderStyles.btnOptions, ...newOrderStyles.btnSave, ...newOrderStyles.btnData },
            { width: "100%", marginTop: 10, marginBottom: 10 }
          ]}
        >
          <Ionicons name="chevron-forward-circle-outline" color="white" size={18} />
          <Text style={[newOrderStyles.textBtnOptions]}>Siguiente</Text>
        </TouchableOpacity>
        
        <View style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
          {isEditIngreso &&
            <>
              <TouchableOpacity
                onPress={() => { handleSaveIngreso(); }}
                style={[{ ...newOrderStyles.btnOptions, ...newOrderStyles.btnSave }, { width: "100%" }]}
              >
                <Ionicons name="save-outline" color="white" size={18} />
                <Text style={[newOrderStyles.textBtnOptions]}>Grabar</Text>
              </TouchableOpacity>

              <View style={[newTaskStyles.containerButtons, { width: "100%", marginTop: 10 }]}>
                <TouchableOpacity onPress={() => { router.back(); }} style={[newTaskStyles.btnDelete]}>
                  <Ionicons name="close" size={18} color="white" />
                  <Text style={[newOrderStyles.textBtnOptions]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { handleDeleteIngreso(); }} style={[newTaskStyles.btnDelete]}>
                  <Ionicons name="trash-outline" size={18} color="white" />
                  <Text style={[newOrderStyles.textBtnOptions]}>Eliminar ingreso</Text>
                </TouchableOpacity>
              </View>
            </>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
