function ChatBotController($http, $window, $scope)  {
  var ctrl = this;
  ctrl.userMessage = '';
  ctrl.historyData = [];
  ctrl.createdElements = [];
  ctrl.isLoading = false;

  ctrl.$onInit = function() {
    console.log('dsds')
    ctrl.toggleChatbot()
  };

  function createChatLi(message, className) {
    const chatLi = $window.document.createElement("li")
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`
    chatLi.innerHTML = chatContent;

    chatLi.querySelector("p").className = 'loadingDots'
    chatLi.querySelector("p").textContent = message
    return chatLi;
  }

  function generateResponse(incomingChatLi) {
    var API_URL = "https://lms.kz/gpt/api/ask-question";
    var messageElement = incomingChatLi.querySelector('p');

    var thread = localStorage.getItem('thread');
    console.log('thread from frontend ', thread);

    var requestOptions = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: ctrl.userMessage, threadData: thread }),
    };

    $http.post(API_URL, requestOptions.body, requestOptions.headers)
      .then(function(response) {
        var data = response.data;
        messageElement.textContent = data.answer;
        messageElement.classList.remove("loadingDots");
      })
      .catch(function(error) {
        messageElement.classList.remove("loadingDots");
        messageElement.classList.add("error");
        messageElement.textContent = 'Упс что-то пошло не так';
      })
      .finally(function() {
        var chatBox = $window.document.querySelector(".chatbox");
        chatBox.scrollTo(0, chatBox.scrollHeight);
      });
  }

  ctrl.handlSendClick = function() {
    console.log('Button clicked!');
    const chatInput = $window.document.querySelector(".chat-input textarea");
    ctrl.userMessage = chatInput.value.trim();
    chatInput.value = ''
    console.log('User message:', ctrl.userMessage);

    const inputInitHeight = chatInput.scrollHeight;
    chatInput.style.height = `${inputInitHeight}px`;
    console.log(inputInitHeight)

    var chatBox = $window.document.querySelector(".chatbox");
    var newChatLi = createChatLi(ctrl.userMessage, "outgoing")
    ctrl.createdElements.push(newChatLi)
    chatBox.appendChild(newChatLi);
    chatBox.scrollTo(0, chatBox.scrollHeight);

    setTimeout(() => {
      const incomingChatLi = createChatLi('...', "incoming");
      ctrl.createdElements.push(incomingChatLi)
      chatBox.appendChild(incomingChatLi);
      chatBox.scrollTo(0, chatBox.scrollHeight);
      generateResponse(incomingChatLi);
      console.log('created elements', ctrl.createdElements)
    }, 300);
  };

  ctrl.deleteChatHistory = async function() {
    console.log('delete history')
    ctrl.isLoading = true;
    var chatBox = $window.document.querySelector(".chatbox");
    ctrl.createdElements.forEach(function(element) {
      chatBox.removeChild(element);
    });
    ctrl.createdElements = [];
    try {
      const threadInLocalStorage = $window.localStorage.getItem('thread');
      if (threadInLocalStorage) {
          const thread = JSON.parse(threadInLocalStorage);
          const threadId = thread.id;

          const response = await $http.delete(`https://lms.kz/gpt/api/delete-history?threadId=${threadId}`);

          if (response.status === 200) {
              const data = response.data;
              console.log('Chat history deleted:', data.message);
              setTimeout(function() {
                ctrl.isLoading = false; // Скрываем загрузчик после задержки
                ctrl.historyData = [];
                $scope.$apply(); // Применяем изменения
              }, 500)
              // You can perform further actions after successfully deleting the chat history
          } else {
              console.error('Failed to delete chat history:', response.statusText);
              setTimeout(function() {
                ctrl.isLoading = false; // Скрываем загрузчик после задержки
                $scope.$apply(); // Применяем изменения
              }, 500)
          }
      }
    } catch (error) {
        console.error('Error:', error);
    }
  }

  ctrl.handleInputChange = function() {
    var chatInput = $window.document.querySelector(".chat-input textarea");
    const inputInitHeight = chatInput.scrollHeight;
    chatInput.style.height = `${inputInitHeight}px`
    chatInput.style.height = `${chatInput.scrollHeight}px`;
  };

  ctrl.handleKeyDown = function(event) {
    if(event.key === 'Enter' && !event.shiftKey && $window.innerWidth > 800) {
      event.preventDefault();
      ctrl.handlSendClick() // Предполагается, что у вас есть функция handleChat
    }
  };

  $window.document.querySelector(".chat-input textarea").addEventListener("input", ctrl.handleInputChange);
  $window.document.querySelector(".chat-input textarea").addEventListener("keydown", ctrl.handleKeyDown);

  ctrl.closeChatBot = function() {
    $window.document.body.classList.remove('show-chatbot');
  }

  ctrl.toggleChatbot = async function() {
    // $window.document.body.classList.add('show-chatbot');
    ctrl.isLoading = true;
    var chatBox = $window.document.querySelector(".chatbox");
    console.log(ctrl.createdElements)
    ctrl.createdElements.forEach(function(element) {
        chatBox.removeChild(element);
    });
    ctrl.createdElements = [];

    try {
      var threadInLocalStorage = $window.localStorage.getItem('thread');
      if (threadInLocalStorage) {
        var thread = JSON.parse(threadInLocalStorage);
        var threadId = thread.id;

        var response = await $http.get(`https://lms.kz/gpt/api/get-history?threadId=${threadId}`);

        if (response.status === 200) {
          var history = response.data;
          console.log('Chat history:', history);
          
          if (history.entries.length > 0) {
            console.log('chat not empty')
            ctrl.historyData = history.entries
            console.log(ctrl.historyData)
            setTimeout(function() {
              ctrl.isLoading = false; // Скрываем загрузчик после задержки
              $scope.$apply(); // Применяем изменения
              var chatBox = $window.document.querySelector(".chatbox");
              chatBox.scrollTo(0, chatBox.scrollHeight);
            }, 500)
          } else {
            setTimeout(function() {
              ctrl.isLoading = false; // Скрываем загрузчик после задержки
              $scope.$apply(); // Применяем изменения
            }, 500)
          }
        } else {
          console.error('Failed to get chat history:', response.statusText);
          setTimeout(function() {
            ctrl.isLoading = false; // Скрываем загрузчик после задержки
            $scope.$apply(); // Применяем изменения
          }, 500)
        }
      } else {
        var user = 'Ondrey';
        console.log(user)

        var createThreadResponse = await $http.post('https://lms.kz/gpt/api/create-thread', { username: user });
        if (createThreadResponse.status === 200) {
          var data = createThreadResponse.data;
          console.log('Response data:', data);

          var thread = data.thread;
          console.log('New thread created:', thread);

          $window.localStorage.setItem('thread', JSON.stringify(thread));
          console.log('Thread saved to localStorage:', thread);
          setTimeout(function() {
            ctrl.isLoading = false; // Скрываем загрузчик после задержки
            $scope.$apply(); // Применяем изменения
          }, 500)
        } else {
          console.error('Failed to create thread:', createThreadResponse.statusText);
          setTimeout(function() {
            ctrl.isLoading = false; // Скрываем загрузчик после задержки
            $scope.$apply(); // Применяем изменения
          }, 500)
        }
      }
    } catch(error) {
      console.error('Error:', error);
      setTimeout(function() {
        ctrl.isLoading = false; // Скрываем загрузчик после задержки
        $scope.$apply(); // Применяем изменения
      }, 500)
    }
   
  };

  
}


angular.module('myModule')
  .component('chatBot', {
    templateUrl: 'app.template.html',
    controller: ['$http', '$window', '$scope', ChatBotController]
  });