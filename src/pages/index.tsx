import './index.less';

import {useEffect, useState} from 'react';
import {
  ClearOutlined,
  DownOutlined,
  EditOutlined,
  GithubOutlined,
  LinkOutlined,
  PlusOutlined,
  RedoOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  DeleteOutlined,
  CopyOutlined,
  SettingOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Dropdown,
  InputNumber,
  Space,
} from 'antd';
import type {MenuProps} from 'antd';
import moment from 'moment';
import {request} from 'umi';
import {CopyToClipboard} from 'react-copy-to-clipboard';

export default function IndexPage() {
  const [connectSettingModalVisible, setConnectSettingModalVisible] = useState(false);
  const [systemKnowledgeModalVisible, setSystemKnowledgeModalVisible] = useState(false);
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('API_URL') || "https://api.openai.com",
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('API_KEY') || "put-your-api-key-here",
  );

  const [inputValue, setInputValue] = useState('');
  const [sessionList, setSessionList] = useState([{
    name: moment().format('YYYYMMDD#HHmmss#SSS'),
    messages: [],
  }]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [isUpdateSessionList, setIsUpdateSessionList] = useState(true);
  const [currentSession, setCurrentSession] = useState({
    name: moment().format('YYYYMMDD#HHmmss#SSS'),
    messages: [],
  });

  const initParam = {
    modelParam: 'gpt-3.5-turbo',
    tempParam: 0,
    maxLenParam: 1024,
    topPParam: 0.8,
    freqPenParam: 0,
    presPenParam: 0
  };
  const [params, setParams] = useState(initParam);

  const [systemKnowledge, setSystemKnowledge] = useState(
    localStorage.getItem('SYSTEM_KNOWLEDGE') || ""
  );
  const [systemKnowledgeTemp, setSystemKnowledgeTemp] = useState(systemKnowledge);

  const [sendModeState, setSendModeState] = useState("Real");
  const [sendRoleState, setSendRoleState] = useState("User");

  const [form] = Form.useForm();

  useEffect(() => {
    console.log('# init from local storage');
    const sessionListFromLocalStorage = localStorage.getItem('SESSION_LIST');
    if (sessionListFromLocalStorage !== null) {
      const currentSessionList = JSON.parse(sessionListFromLocalStorage);
      setSessionList(currentSessionList);
      setIsUpdateSessionList(true);
      setCurrentSession(currentSessionList[0]);
    }
  }, []);

  // save session list on current session change
  useEffect(() => {
    console.log('[save] currentSession');
    // 如果只更新 sessionIndex，则不需要更新 sessionList
    if (isUpdateSessionList) {
      setSessionList((sessionList) => {
        const currentSessionList = [...sessionList];
        currentSessionList[sessionIndex] = {...currentSession};
        return currentSessionList;
      });
    }
  }, [currentSession]);

  // save session list
  useEffect(() => {
    console.log('[save] sessionList');
    localStorage.setItem('SESSION_LIST', JSON.stringify(sessionList));
  }, [sessionList]);

  // scroll to bottom
  useEffect(() => {
    console.log('[scroll] to bottom');
    const messageContent = document.getElementsByClassName('card-content')[1];
    if (messageContent) {
      messageContent.scrollTo({
        top: messageContent.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentSession.messages.length]);

  const addNewSession = () => {
    const initSession = {
      name: moment().format('YYYYMMDD#HHmmss#SSS'),
      messages: [],
    };
    setSessionList((sessionList) => [{...initSession}, ...sessionList]);
    setSessionIndex(0);
    setIsUpdateSessionList(true);
    setCurrentSession({...initSession});
  };

  const deleteCurrentSession = (index: number) => {
    console.log('[delete] sessionIndex: ' + index);
    const currentSessionList = [...sessionList];
    currentSessionList.splice(index, 1);
    if (currentSessionList.length > 0) {
      setSessionList(currentSessionList);
    } else {
      const initSession = {
        name: moment().format('YYYYMMDD#HHmmss#SSS'),
        messages: [],
      };
      setSessionList([{...initSession}]);
    }
  };

  const clearSessionList = () => {
    console.log('[clear] session list');
    const initSession = {
      name: moment().format('YYYYMMDD#HHmmss#SSS'),
      messages: [],
    };
    setSessionList([{...initSession}]);
    changeSessionIndex(0);
  };

  const changeSessionIndex = (index: number) => {
    console.log('[change] sessionIndex: ' + index);
    setSessionIndex(index);

    setIsUpdateSessionList(false);
    setCurrentSession(sessionList[index]);
  };

  const onSetURLIsOK = () => {
    const formApiUrl = form.getFieldValue('apiUrl');
    setApiUrl(formApiUrl);
    localStorage.setItem('API_URL', formApiUrl);
    const formApiKey = form.getFieldValue('apiKey');
    setApiUrl(formApiKey);
    localStorage.setItem('API_KEY', formApiKey);

    setConnectSettingModalVisible(false);
    message.success('set url success');
  };

  const onSetSystemKnowledgeIsOK = () => {
    setSystemKnowledge(systemKnowledgeTemp);
    localStorage.setItem('SYSTEM_KNOWLEDGE', systemKnowledgeTemp);

    setSystemKnowledgeModalVisible(false);
    message.success('update system knowledge success');
  };

  const clickSend = () => {
    const value = inputValue;
    console.log('send: ' + value);

    if (sendModeState === "virtual") {
      setIsUpdateSessionList(true);
      setCurrentSession((session: any) => {
        return {
          ...session,
          messages: [...session.messages, {role: sendRoleState, content: value}],
        };
      });
    } else {
      // send message to api
      if (value.trim().length > 0) {
        const updatedSession = {
          ...currentSession,
          messages: [
            ...currentSession.messages,
            {role: sendRoleState, content: value},
          ],
        };

        setIsUpdateSessionList(true);
        setCurrentSession((session: any) => {
          return {
            ...session,
            messages: [...session.messages, {role: 'user', content: value}],
          };
        });

        request(apiUrl + "/v1/chat/completions", {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
          },
          data: {
            model: params.modelParam,
            messages: [
              {
                "role": "system",
                "content": systemKnowledge
              },
              ...currentSession.messages
            ],
            temperature: params.tempParam,
            top_p: params.topPParam,
            max_tokens: params.maxLenParam,
            presence_penalty: params.presPenParam,
            frequency_penalty: params.freqPenParam,
          }
        }).then((res) => {
          console.log(res);
          setCurrentSession((session: any) => {
            return {
              ...session,
              messages: [...session.messages, res.choices[0].message],
            };
          });
        })

        setInputValue('');
      } else {
        message.error('please input message');
      }
    }
  };

  const clickSendMode = () => {
    if (sendModeState === 'real') {
      setSendModeState('virtual');
    } else {
      setSendModeState('real');
      setSendRoleState('user');
    }
  }

  const clickSendRole = () => {
    if (sendRoleState === 'user') {
      if (sendModeState === 'real') {
        message.warning("In [Real] model, only [User] role is available!")
      } else {
        setSendRoleState('assistant');
      }
    } else {
      setSendRoleState('user');
    }
  }

  const deleteSingleMessage = (index: number) => {
    const messages = currentSession.messages;
    messages.splice(index, 1);

    setCurrentSession((session: any) => {
      return {
        ...session,
        messages: messages,
      };
    });

    message.success("delete single message success!");
  }

  const modelParamItems: MenuProps['items'] = [
    {label: 'gpt-3.5-turbo', key: 'gpt-3.5-turbo'},
    {label: 'gpt-3.5-turbo-0613', key: 'gpt-3.5-turbo-0613'},
    {label: 'gpt-3.5-turbo-0301', key: 'gpt-3.5-turbo-0301'},
    {label: 'gpt-3.5-turbo-16k', key: 'gpt-3.5-turbo-16k'},
    {label: 'gpt-3.5-turbo-16k-0613', key: 'gpt-3.5-turbo-16k-0613'},
    {label: 'gpt-4', key: 'gpt-4'},
    {label: 'gpt-4-0613', key: 'gpt-4-0613'},
    {label: 'gpt-4-0314', key: 'gpt-4-0314'},
  ];

  const resetParameters = () => {
    setParams(initParam);
    message.success("Reset success!");
  }

  return (
    <div>
      <Row className="page-body">
        {/*左边卡片*/}
        <Col xs={0} md={4} lg={6}>
          <Card
            hoverable
            className="left-card"
            title="Session"
            extra={
              <Button
                shape="circle"
                icon={<PlusOutlined/>}
                onClick={addNewSession}
              />
            }
            actions={[
              <Popconfirm
                title="Confirm to DELETE all session?"
                onConfirm={clearSessionList}
                okText="ok"
                cancelText="cancel"
              >
                <Button
                  ghost
                  className="full-button"
                  type="primary"
                  icon={<ClearOutlined/>}
                  size={'large'}
                  danger
                >
                  Clear
                </Button>
              </Popconfirm>,
            ]}
          >
            <div className="card-content">
              <List
                bordered
                itemLayout="horizontal"
                dataSource={sessionList}
                renderItem={(item, index) => (
                  <List.Item
                    key={index}
                    style={{
                      backgroundColor: sessionIndex === index ? '#e6f4ff' : 'white',
                    }}
                    actions={[
                      <Button
                        ghost
                        type="primary"
                        icon={<EditOutlined/>}
                        size={'small'}
                        onClick={() => {
                          message.warning('to do...');
                        }}
                      />,
                      <Button
                        ghost
                        type="primary"
                        icon={<DownloadOutlined/>}
                        size={'small'}
                        onClick={() => {
                          message.warning('to do...');
                        }}
                      />,
                      <Popconfirm
                        title="Confirm to DELETE this session?"
                        onConfirm={() => deleteCurrentSession(index)}
                        okText="ok"
                        cancelText="cancel"
                      >
                        <Button
                          ghost
                          type="primary"
                          icon={<ClearOutlined/>}
                          size={'small'}
                          danger
                        />
                      </Popconfirm>,
                    ]}
                    onClick={() => changeSessionIndex(index)}
                  >
                    <List.Item.Meta key={index} title={item.name}/>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/*中间卡片*/}
        <Col xs={24} md={16} lg={12}>
          <Modal
            title="Connect setting"
            centered
            destroyOnClose
            open={connectSettingModalVisible}
            onOk={onSetURLIsOK}
            onCancel={() => setConnectSettingModalVisible(false)}
            width={400}
          >
            <Form
              labelCol={{span: 6}}
              wrapperCol={{span: 18}}
              form={form}
              initialValues={{apiUrl: apiUrl, apiKey: apiKey}}
            >
              <Form.Item
                label="API_URL"
                name="apiUrl"
                rules={[{message: 'please input api url'}]}
              >
                <Input allowClear/>
              </Form.Item>
              <Form.Item
                label="API_KEY"
                name="apiKey"
                rules={[{message: 'please input api key'}]}
              >
                <Input allowClear/>
              </Form.Item>
            </Form>
          </Modal>
          <Card
            title={
              <div>
                <Button
                  shape="circle"
                  icon={<GithubOutlined/>}
                  href={'https://github.com/Ailln/chat-ollm'}
                />
                <span style={{marginLeft: 10}}>{'Chat OLLM'}</span>
              </div>
            }
            hoverable
            className="card"
            extra={<Button
              shape="circle"
              icon={<LinkOutlined/>}
              onClick={() => setConnectSettingModalVisible(true)}
            />}
            actions={[
              <div className="human-input">
                <Space.Compact size="large">
                  <Button
                    className="human-input-left-button-mode"
                    size={'large'}
                    onClick={clickSendMode}
                    type={sendModeState === 'virtual' ? "dashed" : "default"}
                  >
                    {sendModeState === 'virtual' ? "Virtual" : "Real"}
                  </Button>
                  <Button
                    className="human-input-left-button-role"
                    size={'large'}
                    onClick={clickSendRole}
                    type={sendRoleState === 'assistant' ? "dashed" : "default"}
                  >
                    {sendRoleState === 'assistant' ? "Assistant" : "User"}
                  </Button>
                </Space.Compact>
                <Input.TextArea
                  autoSize={{minRows: 1, maxRows: 6}}
                  size={'large'}
                  className="human-input-message"
                  placeholder="Please input here"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.currentTarget.value)}
                />
                <Button
                  className="human-input-message-button"
                  type="primary"
                  size={'large'}
                  icon={<SendOutlined/>}
                  onClick={clickSend}
                >
                  Send
                </Button>
              </div>,
            ]}
          >
            <div className="card-content">
              {currentSession.messages.map(
                (messageItem: { role: string; content: string }, index: number) => (
                  <Card
                    size={"small"}
                    actions={[
                      <Popconfirm
                        title="Confirm to DELETE this message?"
                        onConfirm={() => deleteSingleMessage(index)}
                        okText="ok"
                        cancelText="cancel"
                      >
                        <DeleteOutlined key="delete"/>
                      </Popconfirm>,
                      <EditOutlined key="edit"/>,
                      <PlusOutlined key="plus"/>,
                      <CopyToClipboard text={messageItem.content}>
                        <CopyOutlined key="copy" onClick={() => {
                          message.info("copied")
                        }}/>
                      </CopyToClipboard>,
                    ]}
                    className={
                      messageItem.role === 'assistant'
                        ? 'left-message-card'
                        : 'right-message-card ant-card-rtl'
                    }
                  >
                    <Card.Meta
                      key={index}
                      className={
                        messageItem.role === 'assistant'
                          ? 'left-message-card-content'
                          : 'right-message-card-content ant-card-rtl'
                      }
                      avatar={
                        <Avatar
                          icon={messageItem.role === 'assistant' ? <RobotOutlined/> : <UserOutlined/>}
                          size={'large'}
                        />
                      }
                      title={messageItem.role === 'assistant' ? 'Assistant' : 'User'}
                      description={messageItem.content}
                    />
                  </Card>
                ),
              )}
            </div>
          </Card>
          <div className="footer">
            Created by <span className="footer-bold">Ailln</span> at {new Date().getFullYear()}.
          </div>
        </Col>

        {/*右边卡片*/}
        <Col xs={0} md={4} lg={6}>
          <Modal
            title="System knowledge"
            centered
            destroyOnClose
            open={systemKnowledgeModalVisible}
            onOk={onSetSystemKnowledgeIsOK}
            onCancel={() => setSystemKnowledgeModalVisible(false)}
            width={600}
          >
            <Input.TextArea
              showCount
              maxLength={512}
              style={{height: 200, resize: 'none'}}
              placeholder="you are..."
              value={systemKnowledgeTemp}
              onChange={(e) => setSystemKnowledgeTemp(e.currentTarget.value)}
            />
          </Modal>
          <Card
            hoverable
            className="right-card"
            title={'Parameters'}
            extra={
              <Button
                shape="circle"
                icon={<SettingOutlined/>}
                onClick={() => {
                  setSystemKnowledgeTemp(systemKnowledge);
                  setSystemKnowledgeModalVisible(true);
                }}
              />
            }
            actions={[
              <Popconfirm
                title="Confirm to RESET all parameters?"
                onConfirm={resetParameters}
                okText="ok"
                cancelText="cancel"
              >
                <Button
                  ghost
                  className="full-button"
                  type="primary"
                  icon={<RedoOutlined/>}
                  size={'large'}
                >
                  Reset
                </Button>
              </Popconfirm>,
            ]}
          >
            <div className="card-content">
              <div className="param-item">
                <div style={{margin: '8px 0'}}>Model</div>
                <Dropdown.Button
                  menu={{items: modelParamItems, onClick: (e) => setParams({...params, modelParam: e.key})}}
                  icon={<DownOutlined/>} style={{width: '100%'}}>
                  <div>{params.modelParam}</div>
                </Dropdown.Button>
              </div>
              <div className="param-item">
                <div style={{margin: '8px 0'}}>Temperature</div>
                <InputNumber
                  min={0}
                  max={2}
                  style={{width: '100%'}}
                  value={params.tempParam}
                  step={0.1}
                  onChange={(n) => setParams({...params, tempParam: n ?? 0})}
                />
              </div>
              <div className="param-item">
                <div style={{margin: '8px 0'}}>Maximum length</div>
                <InputNumber
                  min={1}
                  max={2048}
                  style={{width: '100%'}}
                  value={params.maxLenParam}
                  step={64}
                  onChange={(n) => setParams({...params, maxLenParam: n ?? 0})}
                />
              </div>
              <div className="param-item">
                <div style={{margin: '8px 0'}}>Top P</div>
                <InputNumber
                  min={0}
                  max={1}
                  style={{width: '100%'}}
                  value={params.topPParam}
                  step={0.1}
                  onChange={(n) => setParams({...params, topPParam: n ?? 0})}
                />
              </div>
              <div className="param-item">
                <div style={{margin: '8px 0'}}>Frequency penalty</div>
                <InputNumber
                  min={0}
                  max={2}
                  style={{width: '100%'}}
                  value={params.freqPenParam}
                  step={0.1}
                  onChange={(n) => setParams({...params, freqPenParam: n ?? 0})}
                />
              </div>
              <div className="param-item">
                <div style={{margin: '8px 0'}}>Presence penalty</div>
                <InputNumber
                  min={0}
                  max={2}
                  style={{width: '100%'}}
                  value={params.presPenParam}
                  step={0.1}
                  onChange={(n) => setParams({...params, presPenParam: n ?? 0})}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
