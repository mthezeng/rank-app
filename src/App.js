import './App.css';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Navbar from 'react-bootstrap/Navbar';
import Table from 'react-bootstrap/Table';
import { useState } from 'react';


let min = 0;
let max = -100;
let n = 0;


function App() {
  const [listData, setListData] = useState({
    good: [],
    ok: [],
    bad: []
  });
  const[newEntry, setNewEntry] = useState("");
  const[target, setTarget] = useState("");
  const[otherOption, setOtherOption] = useState("");
  const[show, setShow] = useState(false);

  function resetState() {
    setNewEntry("");
    setTarget("");
    setOtherOption("");
    min = 0;
    max = -100;
    n = 0;
    setShow(false);
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file || file.type !== 'application/json') {
      alert('Invalid file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setListData(json);
      } catch (error) {
        alert('File is not in the expected format');
        return;
      }
    };
    reader.readAsText(file);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const entryName = event.target.entryName.value;
    for (const choiceListName in listData) {
      if (listData[choiceListName].includes(entryName)) {
        alert(entryName + " already exists in this list");
        return;
      }
    }

    setNewEntry(entryName);
    setShow(true);
  }

  function GoodOkBad() {
    if (!newEntry || target) {
      return;
    }

    return (
      <>
        <ButtonGroup size="lg">
          <Button variant="success" onClick={() => {setTarget("good");}}>Good</Button>
          <Button variant="warning" onClick={() => {setTarget("ok");}}>OK</Button>
          <Button variant="danger" onClick={() => {setTarget("bad");}}>Bad</Button>
        </ButtonGroup>
      </>
    );
  }

  function preferNewEntry() {
    max = n - 1;

    if (min > max) {
      listData[target].splice(n, 0, newEntry);
      resetState();
    } else {
      n = Math.floor((min + max) / 2);
      setOtherOption(listData[target][n]);
    }
  }

  function preferOtherOption() {
    min = n + 1;

    if (min > max) {
      listData[target].splice(n + 1, 0, newEntry);
      resetState();
    } else {
      n = Math.floor((min + max) / 2);
      setOtherOption(listData[target][n]);
    }
  }

  function BinarySearchOptions() {
    if (!target || !newEntry) {
      return;
    }

    if (listData[target].length === 0) {
      listData[target].push(newEntry);
      resetState();
      return;
    }

    if (max === -100) {
      min = 0;
      max = listData[target].length - 1;
      n = Math.floor((min + max) / 2);
      setOtherOption(listData[target][n]);
    }

    return (
      <>
        <ButtonGroup size="lg">
          <Button variant="secondary" onClick={preferNewEntry}>{newEntry}</Button>
          <Button variant="secondary" onClick={preferOtherOption}>{otherOption}</Button>
        </ButtonGroup>
      </>
    );
  }

  function handleDelete(entryName) {
    let newListData = { ...listData };
    for (const choiceListName in newListData) {
      console.log(newListData);
      console.log(choiceListName);
      const index = newListData[choiceListName].indexOf(entryName);

      if (index !== -1) {
        newListData[choiceListName].splice(index, 1);
        setListData(newListData);
        break;
      }
    }
  }

  function handleRerank(entryName) {
    handleDelete(entryName);
    setNewEntry(entryName);
    setShow(true);
  }

  function generateRankedListFromState() {
    let rankedList = [];
    let choiceListMaxes = {good: 10.0, ok: 6.6, bad: 3.3};
    let startingRank = 1;
    let i;

    for (let choiceListName in listData) {
      for (i = 0; i < listData[choiceListName].length; i++) {
        rankedList.push({
          rank: startingRank + i,
          name: listData[choiceListName][i],
          rating: choiceListMaxes[choiceListName] - ((i / listData[choiceListName].length) * 3.3)
        });
      }
      startingRank += listData[choiceListName].length;
    }

    return rankedList;
  }

  function RankedList() {
    let rankedList = generateRankedListFromState();
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Rating</th>
            <th>Options</th>
          </tr>
        </thead>
        <tbody>
          {rankedList.map((entry) => {
            return (
              <tr key={entry.rank}>
                <td>{entry.rank}</td>
                <td>{entry.name}</td>
                <td>{Math.round(entry.rating * 10) / 10}</td>
                <td>
                  <Button variant="secondary" size="sm" onClick={() => handleRerank(entry.name)}>Rerank</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(entry.name)}>Delete</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }

  function AddEntryModal() {
    if (!target) {
      return (
        <Modal show={show} onHide={resetState} centered>
          <Modal.Header closeButton>
            <Modal.Title>What did you think of {newEntry}?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <GoodOkBad />
          </Modal.Body>
        </Modal>
      )
    } else {
      return (
        <Modal show={show} onHide={resetState} centered>
          <Modal.Header closeButton>
            <Modal.Title>Which do you prefer?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <BinarySearchOptions />
          </Modal.Body>
        </Modal>
      )
    }
    
  }

  function handleSaveList(event) {
    event.preventDefault();
    const filename = event.target.listName.value;
    const blob = new Blob([JSON.stringify(listData, null, 2)], { type: 'application/json' });

    // construct a URL for the blob and create a link element for it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.json';
    document.body.appendChild(link);

    // programmatically click link
    link.click();

    // cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleClearList(event) {
    const userConfirmed = window.confirm("This will clear all data in the current list! " +
      "Make sure to save your list if you want to keep it.\n\nAre you sure you want to proceed?");
    if (userConfirmed) {
      setListData({
        good: [],
        ok: [],
        bad: []
      });
    }
  }

  return (
    <div className="App">
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#">Rank</Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="contents">
        <p>
          This is essentially Beli, but you can use it to rank anything.
        </p>

        <h4>Import an existing list</h4>

        <p>
          Warning: this will override the current list. Make sure to save your work before loading a new list.
        </p>

        <Form>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Select list file</Form.Label>
            <Form.Control type="file" onChange={handleFileUpload} />
          </Form.Group>
        </Form>

        <h4>Add a new entry to this list</h4>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Form.Control
              name="entryName"
              aria-label="Large"
              aria-describedby="inputGroup-sizing-sm"
              placeholder="Entry name"
            />
            <Button type="submit" variant="primary" id="button-new-entry">
              Add new list entry
            </Button>
          </InputGroup>
        </Form>

        <h4>Save this list</h4>

        <Form onSubmit={handleSaveList}>
          <InputGroup>
            <Form.Control name="listName" type="text" placeholder="List name" />
            <Button type="submit" variant="success" id="save-button">
              Download list
            </Button>
          </InputGroup>
        </Form>

        <h4>Clear this list</h4>

        <Button variant="danger" id="clear-button" onClick={handleClearList}>Clear list</Button>

        <AddEntryModal />

        <h4>The list</h4>

        <RankedList />

      </Container>

    </div>
  );
}

export default App;
